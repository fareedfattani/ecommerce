<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->boolean('is_admin')->default(false)->index());

        Schema::create('categories', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('slug')->unique(); $table->text('description')->nullable();
            $table->string('image')->nullable(); $table->unsignedInteger('sort_order')->default(0); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('brands', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('slug')->unique(); $table->text('description')->nullable();
            $table->string('logo')->nullable(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('products', function (Blueprint $table) {
            $table->id(); $table->foreignId('category_id')->constrained()->restrictOnDelete(); $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name'); $table->string('slug')->unique(); $table->string('sku')->unique(); $table->decimal('price', 12, 2);
            $table->decimal('sale_price', 12, 2)->nullable(); $table->unsignedInteger('stock')->default(0); $table->string('condition')->default('new');
            $table->boolean('is_featured')->default(false); $table->boolean('is_sale')->default(false); $table->boolean('is_active')->default(true);
            $table->string('image')->nullable(); $table->json('gallery')->nullable(); $table->json('specs')->nullable(); $table->text('short_description')->nullable();
            $table->longText('description')->nullable(); $table->string('seo_title')->nullable(); $table->text('seo_description')->nullable(); $table->timestamps();
            $table->index(['is_active', 'is_featured']); $table->index(['category_id', 'brand_id']);
        });
        Schema::create('orders', function (Blueprint $table) {
            $table->id(); $table->string('order_number')->unique(); $table->string('customer_name'); $table->string('email')->nullable();
            $table->string('phone', 30); $table->string('city'); $table->text('address'); $table->text('notes')->nullable(); $table->string('payment_method')->default('cod');
            $table->string('status')->default('pending'); $table->decimal('subtotal', 12, 2); $table->decimal('shipping', 12, 2)->default(0);
            $table->decimal('total', 12, 2); $table->timestamps(); $table->index(['status', 'created_at']);
        });
        Schema::create('order_items', function (Blueprint $table) {
            $table->id(); $table->foreignId('order_id')->constrained()->cascadeOnDelete(); $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name'); $table->string('sku'); $table->unsignedInteger('quantity'); $table->decimal('unit_price', 12, 2); $table->decimal('total', 12, 2); $table->timestamps();
        });
        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id(); $table->foreignId('order_id')->constrained()->cascadeOnDelete(); $table->string('status'); $table->text('note')->nullable(); $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); $table->timestamps();
        });

        foreach (['posts', 'pages'] as $name) {
            Schema::create($name, function (Blueprint $table) use ($name) {
                $table->id(); $table->string('title'); $table->string('slug')->unique(); $table->text('excerpt')->nullable(); $table->longText('content')->nullable();
                $table->string('image')->nullable(); $table->string('seo_title')->nullable(); $table->text('seo_description')->nullable(); $table->boolean('is_active')->default(true);
                if ($name === 'posts') $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        }
        Schema::create('banners', function (Blueprint $table) {
            $table->id(); $table->string('title'); $table->string('subtitle')->nullable(); $table->string('image')->nullable(); $table->string('button_text')->nullable();
            $table->string('url')->nullable(); $table->string('position')->default('home'); $table->unsignedInteger('sort_order')->default(0); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('faqs', function (Blueprint $table) {
            $table->id(); $table->string('question'); $table->text('answer'); $table->unsignedInteger('sort_order')->default(0); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('role')->nullable(); $table->text('content'); $table->unsignedTinyInteger('rating')->default(5);
            $table->string('image')->nullable(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('subscribers', function (Blueprint $table) {
            $table->id(); $table->string('email')->unique(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('settings', function (Blueprint $table) {
            $table->id(); $table->string('key')->unique(); $table->text('value')->nullable(); $table->string('type')->default('text'); $table->string('group')->default('general'); $table->timestamps();
        });
        Schema::create('contacts', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('email')->nullable(); $table->string('phone', 30)->nullable(); $table->string('subject')->nullable();
            $table->text('message'); $table->boolean('is_read')->default(false); $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['contacts','settings','subscribers','testimonials','faqs','banners','pages','posts','order_status_histories','order_items','orders','products','brands','categories'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('is_admin'));
    }
};
