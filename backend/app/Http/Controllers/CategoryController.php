<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::whereNull('parent_id')
            ->with(['children' => function($query) {
                $query->orderBy('order');
            }])
            ->orderBy('order')
            ->get();

        return response()->json([
            'success' => true,
            'categories' => $categories->map(function ($cat) {
                return [
                    'id' => $cat->id,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'icon' => $cat->icon,
                    'subcategories' => $cat->children->map(function ($sub) {
                        return [
                            'id' => $sub->id,
                            'name' => $sub->name,
                            'slug' => $sub->slug,
                        ];
                    })
                ];
            })
        ]);
    }

    public function getAdsBySlug(Request $request, $slug)
    {
        $category = Category::where('slug', $slug)->first();

        if (!$category) {
            return response()->json(['success' => false, 'message' => 'Category not found'], 404);
        }

        // Get all category IDs including self and children
        $categoryIds = [$category->id];
        $childrenIds = Category::where('parent_id', $category->id)->pluck('id')->toArray();
        $categoryIds = array_merge($categoryIds, $childrenIds);

        $query = \App\Models\Ad::with(['images' => function($q) {
                $q->where('is_primary', true)->orWhere('sort_order', 0);
            }, 'user'])
            ->whereIn('category_id', $categoryIds)
            ->where('status', 'active');

        // Apply filters (same as AdController)
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('description', 'LIKE', '%' . $request->search . '%');
            });
        }
        if ($request->has('min_price')) $query->where('price', '>=', $request->min_price);
        if ($request->has('max_price')) $query->where('price', '<=', $request->max_price);
        if ($request->has('location')) $query->where('location', 'LIKE', '%' . $request->location . '%');
        if ($request->has('condition')) $query->where('condition', $request->condition);

        switch ($request->sort) {
            case 'price_low':
                $query->orderBy('price', 'asc');
                break;
            case 'price_high':
                $query->orderBy('price', 'desc');
                break;
            case 'popular':
                $query->orderBy('views_count', 'desc');
                break;
            case 'newest':
            default:
                $query->latest();
                break;
        }

        $ads = $query->paginate(12);

        // Format ads
        $ads->getCollection()->transform(function ($ad) {
            $primaryImage = $ad->images->firstWhere('is_primary', true) ?? $ad->images->first();
            return [
                'id' => $ad->id,
                'title' => $ad->title,
                'price' => $ad->price,
                'location' => $ad->location,
                'created_at' => $ad->created_at,
                'primary_image' => $primaryImage ? $primaryImage->image_url : null,
                'seller_name' => $ad->user->name,
                'seller_avatar' => $ad->user->avatar_url,
            ];
        });

        return response()->json([
            'success' => true,
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
            ],
            'ads' => $ads
        ]);
    }
}
