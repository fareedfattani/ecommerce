<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

class AdminBackupController extends Controller
{
    public function info(): JsonResponse
    {
        $storagePath = storage_path('app/public');
        $connection = $this->connection();

        return response()->json([
            'data' => [
                'database' => [
                    'driver' => $connection['driver'] ?? config('database.default'),
                    'name' => $connection['database'] ?? null,
                    'size' => $this->databaseSize(),
                ],
                'storage' => [
                    'path' => 'storage/app/public',
                    'size' => $this->formatBytes($this->directorySize($storagePath)),
                    'files' => $this->fileCount($storagePath),
                ],
            ],
        ]);
    }

    public function downloadDatabase(): BinaryFileResponse
    {
        set_time_limit(0);

        $connection = $this->connection();
        $driver = $connection['driver'] ?? 'mysql';

        $this->ensureBackupDirectory();
        $filename = 'database-'.now()->format('Y-m-d-His').'.sql';
        $path = storage_path('app/backups/'.$filename);

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $this->dumpMysqlDatabase($connection, $path);
        } elseif ($driver === 'sqlite') {
            $source = $connection['database'] ?? database_path('database.sqlite');
            if (! is_file($source)) {
                abort(404, 'SQLite database file was not found.');
            }
            File::copy($source, $path);
        } else {
            abort(422, 'Database backup is not supported for this connection.');
        }

        return response()->download($path, $filename, [
            'Content-Type' => 'application/sql',
        ])->deleteFileAfterSend(true);
    }

    public function restoreDatabase(Request $request): JsonResponse
    {
        $request->validate([
            'backup' => 'required|file|extensions:sql,txt|max:512000',
            'confirm' => 'accepted',
        ]);

        $connection = $this->connection();
        $driver = $connection['driver'] ?? 'mysql';
        $tempPath = $this->stageUploadedFile($request->file('backup'), 'sql');

        try {
            if (in_array($driver, ['mysql', 'mariadb'], true)) {
                $this->restoreMysqlDatabase($connection, $tempPath);
            } elseif ($driver === 'sqlite') {
                $target = $connection['database'] ?? database_path('database.sqlite');
                File::copy($tempPath, $target);
            } else {
                abort(422, 'Database restore is not supported for this connection.');
            }
        } finally {
            File::delete($tempPath);
        }

        return response()->json(['message' => 'Database restored successfully.']);
    }

    public function downloadStorage(): BinaryFileResponse
    {
        set_time_limit(0);

        $source = storage_path('app/public');
        if (! is_dir($source)) {
            abort(404, 'Storage folder was not found.');
        }

        $this->ensureBackupDirectory();
        $filename = 'storage-'.now()->format('Y-m-d-His').'.zip';
        $path = storage_path('app/backups/'.$filename);
        $this->zipDirectory($source, $path);

        return response()->download($path, $filename, [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    public function restoreStorage(Request $request): JsonResponse
    {
        $request->validate([
            'backup' => 'required|file|mimes:zip|max:512000',
            'confirm' => 'accepted',
        ]);

        $uploaded = $request->file('backup');
        $tempZip = $this->stageUploadedFile($uploaded, 'zip');
        $tempExtract = storage_path('app/backups/extract-'.Str::uuid());
        $target = storage_path('app/public');

        try {
            File::ensureDirectoryExists($tempExtract);
            $this->extractZip($tempZip, $tempExtract);
            $this->copyDirectory($tempExtract, $target);
        } finally {
            File::delete($tempZip);
            File::deleteDirectory($tempExtract);
        }

        return response()->json(['message' => 'Storage restored successfully.']);
    }

    private function connection(): array
    {
        $name = config('database.default');

        return config("database.connections.{$name}") ?? [];
    }

    private function ensureBackupDirectory(): void
    {
        File::ensureDirectoryExists(storage_path('app/backups'));
    }

    private function stageUploadedFile(\Illuminate\Http\UploadedFile $file, string $extension): string
    {
        $this->ensureBackupDirectory();
        $path = storage_path('app/backups/restore-'.Str::uuid().'.'.$extension);
        $file->move(dirname($path), basename($path));

        if (! is_file($path)) {
            abort(500, 'Uploaded backup file could not be saved.');
        }

        return $path;
    }

    private function dumpMysqlDatabase(array $connection, string $path): void
    {
        $binary = $this->mysqldumpBinary();
        if ($binary) {
            $command = [
                $binary,
                '--host='.(string) $connection['host'],
                '--port='.(string) ($connection['port'] ?: 3306),
                '--user='.(string) $connection['username'],
                '--single-transaction',
                '--quick',
                '--lock-tables=false',
                '--no-tablespaces',
                (string) $connection['database'],
            ];

            $result = Process::env(['MYSQL_PWD' => (string) ($connection['password'] ?? '')])
                ->timeout(600)
                ->run($command);

            $output = $result->output();
            if ($output !== '') {
                File::put($path, $output);
            }

            if (is_file($path) && filesize($path) > 0) {
                return;
            }
        }

        $this->dumpMysqlDatabaseWithPhp($path);

        if (! is_file($path) || filesize($path) === 0) {
            File::delete($path);
            abort(500, 'Database backup failed.');
        }
    }

    private function mysqldumpBinary(): ?string
    {
        foreach (['/usr/bin/mysqldump', '/usr/local/bin/mysqldump'] as $binary) {
            if (is_file($binary) && is_executable($binary)) {
                return $binary;
            }
        }

        return null;
    }

    private function dumpMysqlDatabaseWithPhp(string $path): void
    {
        $pdo = DB::connection()->getPdo();
        $tables = collect(DB::select('SHOW FULL TABLES'))
            ->map(function ($row) {
                $values = array_values((array) $row);

                return [
                    'name' => (string) ($values[0] ?? ''),
                    'type' => strtoupper((string) ($values[1] ?? 'BASE TABLE')),
                ];
            })
            ->filter(fn (array $table) => $table['name'] !== '' && preg_match('/^[A-Za-z0-9_]+$/', $table['name']))
            ->values();

        $handle = fopen($path, 'w');
        if ($handle === false) {
            abort(500, 'Could not write database backup file.');
        }

        try {
            fwrite($handle, "-- Nexify SQL backup\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n\n");

            foreach ($tables as $table) {
                $name = $table['name'];
                $quoted = '`'.str_replace('`', '``', $name).'`';
                $create = DB::selectOne("SHOW CREATE TABLE {$quoted}");
                $createSql = is_object($create)
                    ? ($create->{'Create Table'} ?? $create->{'Create View'} ?? null)
                    : null;

                if (! is_string($createSql) || $createSql === '') {
                    continue;
                }

                fwrite($handle, "DROP TABLE IF EXISTS {$quoted};\n{$createSql};\n\n");

                if ($table['type'] !== 'BASE TABLE') {
                    continue;
                }

                $rows = DB::table($name)->get();
                foreach ($rows->chunk(100) as $chunk) {
                    $lines = [];
                    foreach ($chunk as $row) {
                        $values = [];
                        foreach ((array) $row as $value) {
                            if ($value === null) {
                                $values[] = 'NULL';
                            } elseif (is_bool($value)) {
                                $values[] = $value ? '1' : '0';
                            } elseif (is_int($value) || is_float($value)) {
                                $values[] = (string) $value;
                            } else {
                                $values[] = $pdo->quote((string) $value);
                            }
                        }
                        $lines[] = '('.implode(',', $values).')';
                    }
                    if ($lines) {
                        fwrite($handle, "INSERT INTO {$quoted} VALUES ".implode(",\n", $lines).";\n");
                    }
                }

                fwrite($handle, "\n");
            }

            fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
        } finally {
            fclose($handle);
        }
    }

    private function restoreMysqlDatabase(array $connection, string $sqlPath): void
    {
        if (! is_file($sqlPath)) {
            abort(422, 'Uploaded SQL backup file was not found.');
        }

        $command = [
            'mysql',
            '--host='.$connection['host'],
            '--port='.$connection['port'],
            '--user='.$connection['username'],
            $connection['database'],
        ];

        $result = Process::env(['MYSQL_PWD' => (string) ($connection['password'] ?? '')])
            ->timeout(600)
            ->input(file_get_contents($sqlPath) ?: '')
            ->run($command);

        if (! $result->successful()) {
            abort(500, trim($result->errorOutput() ?: 'Database restore failed.'));
        }
    }

    private function zipDirectory(string $source, string $zipPath): void
    {
        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Could not create storage backup archive.');
        }

        $source = rtrim($source, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($iterator as $item) {
            $relative = Str::after($item->getPathname(), $source);
            if ($relative === '' || str_contains($relative, '..')) {
                continue;
            }

            $top = explode(DIRECTORY_SEPARATOR, str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative))[0];
            if ($top === 'backups') {
                continue;
            }

            if ($item->isDir()) {
                $zip->addEmptyDir($relative);
            } else {
                $zip->addFile($item->getPathname(), $relative);
            }
        }

        $zip->close();

        if (! is_file($zipPath) || filesize($zipPath) === 0) {
            File::delete($zipPath);
            abort(500, 'Storage backup archive is empty.');
        }
    }

    private function extractZip(string $zipPath, string $destination): void
    {
        $zip = new ZipArchive;
        if ($zip->open($zipPath) !== true) {
            abort(422, 'Uploaded file is not a valid ZIP archive.');
        }

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if ($name === false || str_contains($name, '..') || str_starts_with($name, '/')) {
                $zip->close();
                abort(422, 'ZIP archive contains unsafe file paths.');
            }
        }

        if (! $zip->extractTo($destination)) {
            $zip->close();
            abort(500, 'Could not extract storage backup.');
        }

        $zip->close();
    }

    private function copyDirectory(string $source, string $destination): void
    {
        File::ensureDirectoryExists($destination);
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($iterator as $item) {
            $relative = Str::after($item->getPathname(), rtrim($source, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR);
            if ($relative === '' || str_contains($relative, '..')) {
                continue;
            }

            $target = $destination.DIRECTORY_SEPARATOR.$relative;
            if ($item->isDir()) {
                File::ensureDirectoryExists($target);
            } else {
                File::ensureDirectoryExists(dirname($target));
                File::copy($item->getPathname(), $target);
            }
        }
    }

    private function databaseSize(): string
    {
        $connection = $this->connection();
        $driver = $connection['driver'] ?? config('database.default');

        if ($driver === 'sqlite') {
            $path = $connection['database'] ?? database_path('database.sqlite');

            return is_file($path) ? $this->formatBytes(filesize($path)) : '0 B';
        }

        if (! in_array($driver, ['mysql', 'mariadb'], true)) {
            return 'Unknown';
        }

        try {
            $database = $connection['database'];
            $row = DB::selectOne(
                'SELECT ROUND(SUM(data_length + index_length)) AS size FROM information_schema.tables WHERE table_schema = ?',
                [$database],
            );

            return $this->formatBytes((int) ($row->size ?? 0));
        } catch (\Throwable) {
            return 'Unknown';
        }
    }

    private function directorySize(string $path): int
    {
        if (! is_dir($path)) {
            return 0;
        }

        $size = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }

    private function fileCount(string $path): int
    {
        if (! is_dir($path)) {
            return 0;
        }

        $count = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $count++;
            }
        }

        return $count;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = min((int) floor(log($bytes, 1024)), count($units) - 1);

        return round($bytes / (1024 ** $power), 2).' '.$units[$power];
    }
}
