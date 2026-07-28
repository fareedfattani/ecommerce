<?php

namespace Tests\Feature;

use App\Models\{Brand, Category, Coupon, Product, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NexifyBackendTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_catalog_filters_active_products(): void
    {
        $category=Category::create(['name'=>'Laptops','slug'=>'laptops']);
        $brand=Brand::create(['name'=>'Nexify','slug'=>'nexify']);
        Product::create(['category_id'=>$category->id,'brand_id'=>$brand->id,'name'=>'Active Laptop','slug'=>'active-laptop','sku'=>'A-1','price'=>100000,'stock'=>2,'is_active'=>true]);
        Product::create(['category_id'=>$category->id,'brand_id'=>$brand->id,'name'=>'Hidden Laptop','slug'=>'hidden-laptop','sku'=>'H-1','price'=>90000,'stock'=>2,'is_active'=>false]);

        $this->getJson('/api/products?category=laptops&search=Active')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.slug','active-laptop');
        Product::create(['category_id'=>$category->id,'brand_id'=>$brand->id,'name'=>'Budget Laptop','slug'=>'budget-laptop','sku'=>'B-1','price'=>5500,'stock'=>2,'is_active'=>true]);
        $this->getJson('/api/products?min_price=5000&max_price=6000')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.slug','budget-laptop');
        $this->getJson('/api/products/active-laptop')->assertOk()->assertJsonPath('product.sku','A-1');
        $this->getJson('/api/storefront')->assertOk()->assertJsonStructure(['settings','categories','brands','banners','featured_products','sale_products','testimonials','faqs','latest_posts']);
    }

    public function test_admin_routes_require_admin_and_login_uses_session(): void
    {
        $this->getJson('/api/cp/dashboard')->assertUnauthorized();
        $admin=User::create(['name'=>'Admin','email'=>'admin@test.test','password'=>'secret-password','is_admin'=>true]);

        $this->postJson('/api/cp/login',['email'=>$admin->email,'password'=>'wrong'])->assertUnprocessable();
        $this->postJson('/api/cp/login',['email'=>$admin->email,'password'=>'secret-password'])->assertOk()->assertJsonPath('user.is_admin',true);
        $this->getJson('/api/cp/user')->assertOk()->assertJsonPath('user.email',$admin->email);
        $this->postJson('/api/cp/banners',['title'=>'Boolean Test','is_active'=>'true'])->assertCreated()->assertJsonPath('data.is_active',true);
        $this->postJson('/api/cp/logout')->assertOk();
    }

    public function test_cod_checkout_uses_server_price_and_decrements_stock(): void
    {
        $category=Category::create(['name'=>'Laptops','slug'=>'laptops']);
        $product=Product::create(['category_id'=>$category->id,'name'=>'Sale Laptop','slug'=>'sale-laptop','sku'=>'SALE-1','price'=>120000,'sale_price'=>110000,'is_sale'=>true,'stock'=>3,'is_active'=>true]);
        $response=$this->postJson('/api/orders',[
            'customer_name'=>'Ali Raza','phone'=>'03001234567','city'=>'Lahore','address'=>'House 10, Model Town, Lahore',
            'items'=>[['product_id'=>$product->id,'quantity'=>2,'price'=>1]],
        ]);
        $response->assertCreated()->assertJsonPath('order.total','220000.00')->assertJsonPath('order.items.0.unit_price','110000.00');
        $this->assertDatabaseHas('products',['id'=>$product->id,'stock'=>1]);
        $this->assertDatabaseHas('orders',['phone'=>'03001234567','payment_method'=>'cod','status'=>'pending']);
    }

    public function test_coupon_is_validated_and_applied_to_server_calculated_total(): void
    {
        $category=Category::create(['name'=>'Deals','slug'=>'deals']);
        $product=Product::create(['category_id'=>$category->id,'name'=>'Coupon Laptop','slug'=>'coupon-laptop','sku'=>'CP-1','price'=>100000,'stock'=>2,'is_active'=>true]);
        $coupon=Coupon::create(['code'=>'SAVE10','type'=>'percent','value'=>10,'minimum_order'=>50000,'maximum_discount'=>15000,'usage_limit'=>2,'is_active'=>true]);
        $items=[['product_id'=>$product->id,'quantity'=>1]];

        $this->postJson('/api/coupons/validate',['coupon_code'=>'save10','items'=>$items])
            ->assertOk()->assertJsonPath('discount','10000.00')->assertJsonPath('total','90000.00');

        $this->postJson('/api/orders',[
            'customer_name'=>'Sara Khan','phone'=>'03001234567','city'=>'Karachi','address'=>'House 20, Clifton, Karachi',
            'coupon_code'=>'SAVE10','items'=>$items,
        ])->assertCreated()->assertJsonPath('order.discount','10000.00')->assertJsonPath('order.total','90000.00');
        $this->assertDatabaseHas('coupons',['id'=>$coupon->id,'used_count'=>1]);
    }

    public function test_seo_routes_return_expected_content_types(): void
    {
        $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type','application/xml');
        $this->get('/robots.txt')->assertOk()->assertHeader('Content-Type','text/plain; charset=UTF-8')->assertSee('Sitemap:');
    }

    public function test_database_seeder_builds_a_working_catalog(): void
    {
        $this->seed();
        $this->assertDatabaseHas('users',['email'=>'admin@nexify.pk','is_admin'=>true]);
        $this->assertDatabaseCount('products',6);
        $this->getJson('/api/storefront')->assertOk()->assertJsonCount(4,'featured_products');
    }
}
