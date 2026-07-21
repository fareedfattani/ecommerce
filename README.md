# Nexify E-commerce

Laravel 12 + React storefront and administration panel for Nexify System.

## Local setup

1. Copy `.env.example` to `.env` and configure the database.
2. Run `composer install`, `php artisan key:generate`, and `php artisan migrate --seed`.
3. Run `npm install && npm run build`.
4. Point the web root to `public/`, or use the included root `.htaccess` on shared hosting.

## Administration

- Control panel: `/cp`
- Seed account: `admin@nexify.pk`
- Initial password: `Admin@12345`

Change the initial password immediately from the control panel.

## Production deployment

Run:

```bash
php artisan migrate --force
php artisan storage:link
npm ci
npm run build
php artisan optimize
```

Ensure `storage/` and `bootstrap/cache/` are writable by the web server. Configure the scheduler with:

```cron
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```
