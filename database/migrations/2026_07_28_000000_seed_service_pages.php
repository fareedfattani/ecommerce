<?php

use App\Models\Page;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        foreach ($this->pages() as [$title, $slug, $content]) {
            Page::updateOrCreate(
                compact('slug'),
                compact('title', 'content') + ['is_active' => true]
            );
        }
    }

    public function down(): void
    {
        Page::whereIn('slug', array_column($this->pages(), 1))->delete();
    }

    private function pages(): array
    {
        return [
            [
                'Annual Maintenance Contracts (AMC)',
                'annual-maintenance-contracts',
                '<p>Keep your laptops and office systems healthy with scheduled checkups, priority support and clear response times. Nexify AMC plans are built for individuals, cafes and growing teams who cannot afford unexpected downtime.</p><h2>What AMC typically covers</h2><ul><li>Preventive hardware health checks every quarter</li><li>OS updates, driver checks and basic troubleshooting</li><li>Priority remote support with defined response windows</li><li>On-site visits for covered locations (plan dependent)</li><li>Replacement guidance when devices become unreliable</li></ul><h2>Popular plan examples</h2><table><thead><tr><th>Plan</th><th>Best for</th><th>Devices</th><th>Response</th></tr></thead><tbody><tr><td>Essential</td><td>Freelancers &amp; home offices</td><td>1–5</td><td>Next business day</td></tr><tr><td>Business</td><td>Small teams</td><td>6–25</td><td>Same / next day</td></tr><tr><td>Priority</td><td>Multi-location offices</td><td>26+</td><td>Priority queue</td></tr></tbody></table><h2>How it works</h2><ol><li>Share your device list and locations.</li><li>We propose a practical coverage window and pricing.</li><li>You approve the plan and we schedule the first checkup.</li></ol><p><strong>Ready to start?</strong> Message us on WhatsApp or use the contact form with your device count — we will reply with a clear AMC recommendation.</p>',
            ],
            [
                'Networking Services',
                'networking-services',
                '<p>From home Wi-Fi upgrades to small-office structured networking, Nexify helps you plan, install and support reliable connectivity without unnecessary hardware.</p><h2>Popular requests</h2><ul><li>Wi-Fi 6 router selection and placement advice</li><li>Access point coverage for multi-floor spaces</li><li>Office LAN expansion with gigabit switches</li><li>Guest network and basic security setup</li><li>Printer, CCTV and POS network segregation</li></ul><h2>Sample service packages</h2><table><thead><tr><th>Package</th><th>Includes</th><th>Typical timeline</th></tr></thead><tbody><tr><td>Home Boost</td><td>Router review, placement tips, channel cleanup</td><td>1 visit</td></tr><tr><td>Cafe / Shop</td><td>Coverage check, guest Wi-Fi, POS stability tips</td><td>1–2 visits</td></tr><tr><td>Office Starter</td><td>Switch + AP plan, cabling guidance, handover notes</td><td>2–4 days</td></tr></tbody></table><h2>What we need from you</h2><ol><li>Approximate floor size or number of rooms</li><li>How many users / devices connect daily</li><li>Any must-work areas (reception, warehouse, meeting room)</li></ol><p><strong>Need a quote?</strong> Send a short note or floor sketch via contact / WhatsApp and we will suggest a clean, scalable setup.</p>',
            ],
        ];
    }
};
