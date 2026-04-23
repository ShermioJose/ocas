<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Mobiles & Tablets' => ['Smartphones', 'Tablets', 'Accessories'],
            'Cars & Vehicles' => ['Cars', 'Bikes', 'Scooters', 'Auto Parts'],
            'Property' => ['For Sale', 'For Rent', 'Commercial'],
            'Electronics' => ['TVs', 'Laptops', 'Cameras', 'Audio'],
            'Furniture' => ['Sofa', 'Bed', 'Table', 'Wardrobe'],
            'Fashion' => ['Men', 'Women', 'Kids', 'Accessories'],
            'Jobs' => ['Full Time', 'Part Time', 'Freelance'],
            'Services' => ['Repair', 'Cleaning', 'Tutoring'],
            'Books & Learning' => ['Textbooks', 'Novels', 'Courses'],
            'Pets' => ['Dogs', 'Cats', 'Birds', 'Fish'],
            'Sports & Hobbies' => ['Gym', 'Cricket', 'Football', 'Cycling'],
            'Others' => [],
        ];

        $order = 1;
        foreach ($categories as $parent => $subCategories) {
            $parentCategory = Category::create([
                'name' => $parent,
                'slug' => Str::slug($parent),
                'order' => $order++,
            ]);

            $subOrder = 1;
            foreach ($subCategories as $sub) {
                Category::create([
                    'name' => $sub,
                    'slug' => Str::slug($parent . ' ' . $sub),
                    'parent_id' => $parentCategory->id,
                    'order' => $subOrder++,
                ]);
            }
        }
    }
}
