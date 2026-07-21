<?php

namespace Database\Seeders;

use App\Models\{Banner, Brand, Category, Coupon, Faq, Page, Post, Product, Setting, Testimonial, User};
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Storage::disk('public')->put('settings/nexify-logo.png', file_get_contents(public_path('nexify-logo.png')));

        User::updateOrCreate(['email'=>'admin@nexify.pk'],[
            'name'=>'Nexify Administrator','password'=>Hash::make('Admin@12345'),'is_admin'=>true,'email_verified_at'=>now(),
        ]);

        foreach ([
            ['site_name','Nexify System','text','branding'],['logo','settings/nexify-logo.png','image','branding'],['tagline','Smarter laptops. Clearer choices.','text','branding'],
            ['email','support@nexify.pk','text','contact'],['phone','+92 300 1234567','text','contact'],['whatsapp','923001234567','text','contact'],
            ['address','Pakistan','text','contact'],['currency','PKR','text','commerce'],
            ['primary_color','#0867d1','color','theme'],['secondary_color','#08b9d6','color','theme'],['dark_color','#071b33','color','theme'],
            ['announcement','Nationwide delivery with Cash on Delivery','text','homepage'],['hero_title','Technology that moves you forward','text','homepage'],
            ['hero_subtitle','Carefully selected laptops and accessories with clear specifications and reliable support.','textarea','homepage'],
            ['footer_text','Technology made simple, reliable and accessible — delivered across Pakistan.','textarea','footer'],
            ['shipping_fee','0','number','commerce'],['meta_title','Nexify System | Laptops & IT Solutions','text','seo'],
            ['meta_description','Shop carefully selected laptops and accessories across Pakistan.','textarea','seo'],['robots','index,follow','text','seo'],
        ] as [$key,$value,$type,$group]) Setting::updateOrCreate(compact('key'),compact('value','type','group'));

        $categories=[];
        foreach ([['Laptops','Portable computers for work, study and creativity.'],['Gaming Laptops','High-performance systems for smooth gaming.'],['Business Laptops','Reliable systems designed for professional workloads.'],['Accessories','Useful upgrades and everyday laptop essentials.']] as [$name,$description]) {
            $categories[$name]=Category::updateOrCreate(['slug'=>str($name)->slug()],compact('name','description')+['is_active'=>true]);
        }
        $brands=[];
        foreach (['Dell','HP','Lenovo','ASUS','Acer'] as $name) $brands[$name]=Brand::updateOrCreate(['slug'=>str($name)->slug()],compact('name')+['is_active'=>true]);

        $products=[
            ['Dell Inspiron 15 3530','NX-DL-1501','Laptops','Dell',145000,139900,10,true,true,'new',['processor'=>'Intel Core i5 13th Gen','memory'=>'8GB DDR4','storage'=>'512GB SSD','display'=>'15.6-inch FHD'],'Everyday laptop for study, browsing and light office work.'],
            ['HP Pavilion 14','NX-HP-1402','Laptops','HP',152000,null,8,true,false,'new',['processor'=>'Intel Core i5','memory'=>'16GB','storage'=>'512GB SSD','display'=>'14-inch FHD'],'Compact 14-inch laptop with enough power for daily multitasking.'],
            ['Lenovo IdeaPad Slim 3','NX-LN-1403','Laptops','Lenovo',118000,112500,14,true,true,'new',['processor'=>'AMD Ryzen 5','memory'=>'8GB','storage'=>'512GB SSD','display'=>'14-inch FHD'],'Lightweight student-friendly laptop with solid battery for campus days.'],
            ['ASUS Vivobook 15','NX-AS-1504','Laptops','ASUS',134900,null,9,true,false,'new',['processor'=>'Intel Core i5','memory'=>'8GB','storage'=>'512GB SSD','display'=>'15.6-inch FHD'],'Bright FHD display and practical ports for home and college use.'],
            ['Acer Aspire 5','NX-AC-1505','Laptops','Acer',126500,119900,11,false,true,'new',['processor'=>'AMD Ryzen 5','memory'=>'8GB','storage'=>'512GB SSD','display'=>'15.6-inch FHD'],'Value laptop for documents, online classes and everyday entertainment.'],
            ['ASUS TUF Gaming A15','NX-AS-G1506','Gaming Laptops','ASUS',285000,269900,5,true,true,'new',['processor'=>'AMD Ryzen 7','graphics'=>'NVIDIA RTX 4050','memory'=>'16GB DDR5','display'=>'15.6-inch 144Hz'],'Durable gaming laptop for modern titles and content creation.'],
            ['Lenovo LOQ 15','NX-LN-G1507','Gaming Laptops','Lenovo',274900,null,6,true,false,'new',['processor'=>'Intel Core i5','graphics'=>'NVIDIA RTX 4050','memory'=>'16GB','display'=>'15.6-inch 144Hz'],'Balanced gaming machine with strong thermals for long sessions.'],
            ['HP Victus 16','NX-HP-G1608','Gaming Laptops','HP',298000,284500,4,true,true,'new',['processor'=>'AMD Ryzen 7','graphics'=>'NVIDIA RTX 4060','memory'=>'16GB','display'=>'16.1-inch 144Hz'],'Larger screen gaming laptop for immersive play and streaming.'],
            ['Acer Nitro V 15','NX-AC-G1509','Gaming Laptops','Acer',249900,239000,7,true,true,'new',['processor'=>'Intel Core i5','graphics'=>'NVIDIA RTX 4050','memory'=>'16GB','display'=>'15.6-inch 144Hz'],'Entry gaming laptop with high-refresh display for competitive play.'],
            ['Dell G15 Gaming','NX-DL-G1510','Gaming Laptops','Dell',265000,null,5,false,false,'new',['processor'=>'Intel Core i7','graphics'=>'NVIDIA RTX 4050','memory'=>'16GB','display'=>'15.6-inch 120Hz'],'Reliable Dell gaming series for games plus everyday productivity.'],
            ['Dell Latitude 5440','NX-DL-B1401','Business Laptops','Dell',215000,204900,6,true,true,'new',['processor'=>'Intel Core i7 13th Gen','memory'=>'16GB','storage'=>'512GB SSD','display'=>'14-inch FHD'],'Business-ready Latitude built for meetings, travel and long workdays.'],
            ['HP EliteBook 840 G10','NX-HP-B1402','Business Laptops','HP',248000,null,5,true,false,'new',['processor'=>'Intel Core i7','memory'=>'16GB','storage'=>'512GB SSD','display'=>'14-inch FHD','security'=>'Fingerprint'],'Premium EliteBook for professionals who need security and portability.'],
            ['Lenovo ThinkPad E14 Gen 5','NX-LN-B1403','Business Laptops','Lenovo',189900,179900,8,true,true,'new',['processor'=>'AMD Ryzen 5','memory'=>'16GB','storage'=>'512GB SSD','display'=>'14-inch FHD','keyboard'=>'ThinkPad'],'Classic ThinkPad feel with strong keyboard for typing-heavy work.'],
            ['ASUS ExpertBook B1','NX-AS-B1404','Business Laptops','ASUS',168500,null,7,false,false,'new',['processor'=>'Intel Core i5','memory'=>'8GB','storage'=>'512GB SSD','display'=>'14-inch FHD'],'Practical business notebook for sales teams and field staff.'],
            ['HP ProBook 450 G10 Refurbished','NX-HP-B1505','Business Laptops','HP',128000,119500,10,true,true,'refurbished',['processor'=>'Intel Core i5 12th Gen','memory'=>'16GB','storage'=>'512GB SSD','display'=>'15.6-inch FHD'],'Refurbished ProBook with clear condition notes and office-ready specs.'],
            ['Nexify USB-C Multiport Hub','NX-AC-2001','Accessories','Lenovo',12900,10900,35,true,true,'new',['ports'=>'HDMI, USB-A, USB-C PD, SD','warranty'=>'6 months'],'Travel hub for presentations, charging and media transfers.'],
            ['HP 15.6 Laptop Backpack','NX-AC-2002','Accessories','HP',7500,6490,40,true,true,'new',['size'=>'Up to 15.6-inch','material'=>'Water-resistant','pockets'=>'Laptop + accessories'],'Padded backpack for daily commute and campus use.'],
            ['Wireless Silent Mouse','NX-AC-2003','Accessories','Acer',3900,null,50,false,false,'new',['connectivity'=>'Wireless 2.4GHz','battery'=>'AA','dpi'=>'1000'],'Quiet wireless mouse for shared offices and home desks.'],
            ['ASUS Dual-Band Wi-Fi Adapter','NX-AC-2004','Accessories','ASUS',5200,4500,28,false,true,'new',['wifi'=>'Dual-band','interface'=>'USB','os'=>'Windows'],'Quick USB Wi-Fi upgrade for older laptops and desktops.'],
            ['Dell USB-C 65W Charger','NX-AC-2005','Accessories','Dell',9800,null,22,true,false,'new',['power'=>'65W','connector'=>'USB-C','cable'=>'Included'],'USB-C charger for compatible Dell and USB-C notebooks.'],
            ['Lenovo Wireless Keyboard & Mouse Combo','NX-AC-2006','Accessories','Lenovo',8900,7900,30,true,true,'new',['connectivity'=>'2.4GHz','layout'=>'Full-size','warranty'=>'6 months'],'Full-size wireless set for comfortable desk work.'],
            ['Acer Cooling Pad','NX-AC-2007','Accessories','Acer',4500,null,25,false,false,'new',['fans'=>'Dual fan','size'=>'Up to 17-inch','power'=>'USB'],'Cooling pad to reduce heat during gaming and long sessions.'],
        ];
        Product::query()->delete();
        foreach ($products as [$name,$sku,$category,$brandName,$price,$sale,$stock,$featured,$onSale,$condition,$specs,$short]) {
            Product::create([
                'category_id'=>$categories[$category]->id,
                'brand_id'=>$brands[$brandName]->id,
                'name'=>$name,
                'slug'=>str($name)->slug().'-'.strtolower($sku),
                'sku'=>$sku,
                'price'=>$price,
                'sale_price'=>$sale,
                'stock'=>$stock,
                'condition'=>$condition,
                'is_featured'=>$featured,
                'is_sale'=>$onSale || $sale!==null,
                'is_active'=>true,
                'image'=>null,
                'specs'=>$specs,
                'short_description'=>$short,
                'description'=>'<p>'.$short.'</p><p>Specifications are listed clearly so you can compare options with confidence.</p>',
                'seo_title'=>$name.' in Pakistan',
                'seo_description'=>'View price, specs and availability for '.$name.' at Nexify.',
            ]);
        }
        Coupon::updateOrCreate(['code'=>'WELCOME5'],[
            'type'=>'percent','value'=>5,'minimum_order'=>50000,'maximum_discount'=>10000,'usage_limit'=>500,'is_active'=>true,
        ]);

        Banner::updateOrCreate(['title'=>'Find your next laptop'],['subtitle'=>'Original selections for work, study and play.','button_text'=>'Shop laptops','url'=>'/shop','position'=>'home','sort_order'=>1,'is_active'=>true]);
        foreach([
            ['About Nexify','about','Nexify helps customers compare practical laptop options with clear specifications, transparent pricing and responsive local support.'],
            ['Shipping & Returns','shipping-returns','Orders are confirmed before dispatch. Delivery timing depends on destination. Contact support promptly if an item arrives damaged or differs from your order.'],
            ['Privacy Policy','privacy-policy','We collect only the information needed to process orders, answer enquiries and improve our service. We do not sell customer information.'],
            ['Annual Maintenance Contracts (AMC)','annual-maintenance-contracts','<p>Keep your laptops and office systems healthy with scheduled checkups, priority support and clear response times. Nexify AMC plans are built for individuals, cafes and growing teams who cannot afford unexpected downtime.</p><h2>What AMC typically covers</h2><ul><li>Preventive hardware health checks every quarter</li><li>OS updates, driver checks and basic troubleshooting</li><li>Priority remote support with defined response windows</li><li>On-site visits for covered locations (plan dependent)</li><li>Replacement guidance when devices become unreliable</li></ul><h2>Popular plan examples</h2><table><thead><tr><th>Plan</th><th>Best for</th><th>Devices</th><th>Response</th></tr></thead><tbody><tr><td>Essential</td><td>Freelancers &amp; home offices</td><td>1–5</td><td>Next business day</td></tr><tr><td>Business</td><td>Small teams</td><td>6–25</td><td>Same / next day</td></tr><tr><td>Priority</td><td>Multi-location offices</td><td>26+</td><td>Priority queue</td></tr></tbody></table><h2>How it works</h2><ol><li>Share your device list and locations.</li><li>We propose a practical coverage window and pricing.</li><li>You approve the plan and we schedule the first checkup.</li></ol><p><strong>Ready to start?</strong> Message us on WhatsApp or use the contact form with your device count — we will reply with a clear AMC recommendation.</p>'],
            ['Networking Services','networking-services','<p>From home Wi-Fi upgrades to small-office structured networking, Nexify helps you plan, install and support reliable connectivity without unnecessary hardware.</p><h2>Popular requests</h2><ul><li>Wi-Fi 6 router selection and placement advice</li><li>Access point coverage for multi-floor spaces</li><li>Office LAN expansion with gigabit switches</li><li>Guest network and basic security setup</li><li>Printer, CCTV and POS network segregation</li></ul><h2>Sample service packages</h2><table><thead><tr><th>Package</th><th>Includes</th><th>Typical timeline</th></tr></thead><tbody><tr><td>Home Boost</td><td>Router review, placement tips, channel cleanup</td><td>1 visit</td></tr><tr><td>Cafe / Shop</td><td>Coverage check, guest Wi-Fi, POS stability tips</td><td>1–2 visits</td></tr><tr><td>Office Starter</td><td>Switch + AP plan, cabling guidance, handover notes</td><td>2–4 days</td></tr></tbody></table><h2>What we need from you</h2><ol><li>Approximate floor size or number of rooms</li><li>How many users / devices connect daily</li><li>Any must-work areas (reception, warehouse, meeting room)</li></ol><p><strong>Need a quote?</strong> Send a short note or floor sketch via contact / WhatsApp and we will suggest a clean, scalable setup.</p>'],
        ] as [$title,$slug,$content]) Page::updateOrCreate(compact('slug'),compact('title','content')+['is_active'=>true]);
        foreach([
            ['How do I place an order?','Add a product to your cart, enter a valid Pakistan delivery address and phone number, then choose cash on delivery.'],
            ['Are product specifications verified?','We review each listing before publication. Please ask support if you need confirmation of a specific feature before ordering.'],
            ['Can I change an order?','Contact support as soon as possible. Changes may not be possible after dispatch.'],
        ] as $i=>[$question,$answer]) Faq::updateOrCreate(compact('question'),compact('answer')+['sort_order'=>$i+1,'is_active'=>true]);
        foreach([
            ['Choosing RAM and storage for your next laptop','ram-and-storage-guide','A practical guide to selecting memory and storage without paying for capacity you will not use.'],
            ['Five checks before buying a laptop online','laptop-buying-checklist','Review processor generation, display, battery expectations, warranty and upgrade options before ordering.'],
        ] as [$title,$slug,$excerpt]) Post::updateOrCreate(compact('slug'),compact('title','excerpt')+['content'=>$excerpt.' Nexify recommends matching the specification to your real workload and confirming any must-have feature before checkout.','is_active'=>true,'published_at'=>now()]);
        foreach([
            ['Areeba Khan','Designer','The specifications were easy to compare and the team answered my display questions clearly.'],
            ['Usman Raza','Small business owner','Ordering was straightforward and I received a quick confirmation before dispatch.'],
        ] as [$name,$role,$content]) Testimonial::updateOrCreate(compact('name'),compact('role','content')+['rating'=>5,'is_active'=>true]);
    }
}
