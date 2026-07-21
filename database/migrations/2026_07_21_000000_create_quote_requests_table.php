<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_requests', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('contact_person');
            $table->string('designation')->nullable();
            $table->string('email');
            $table->string('phone', 40);
            $table->string('website')->nullable();
            $table->text('business_address')->nullable();
            $table->string('requirement_type');
            $table->json('preferred_brands')->nullable();
            $table->string('quantity');
            $table->text('preferred_specs')->nullable();
            $table->string('budget_range')->nullable();
            $table->json('networking_requirements')->nullable();
            $table->json('service_requirements')->nullable();
            $table->text('project_details')->nullable();
            $table->string('delivery_city')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->json('attachments')->nullable();
            $table->string('preferred_contact')->nullable();
            $table->boolean('declaration')->default(false);
            $table->string('status')->default('new');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_requests');
    }
};
