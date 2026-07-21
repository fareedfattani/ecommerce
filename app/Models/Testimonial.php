<?php
namespace App\Models;
class Testimonial extends ContentModel { protected function casts(): array { return ['is_active'=>'boolean','rating'=>'integer']; } }
