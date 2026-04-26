<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\AdImage;
use App\Models\Category;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class AdController extends Controller
{
    public function index(Request $request)
    {
        $query = Ad::with(['images' => function($q) {
            $q->where('is_primary', true)->orWhere('sort_order', 0);
        }, 'user'])->where('status', 'active');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('description', 'LIKE', '%' . $request->search . '%');
            });
        }

        if ($request->has('category_id')) {
            // Need to get category and all its children
            $catId = $request->category_id;
            $childrenIds = Category::where('parent_id', $catId)->pluck('id')->toArray();
            $allIds = array_merge([$catId], $childrenIds);
            $query->whereIn('category_id', $allIds);
        }

        if ($request->has('subcategory_id')) {
            $query->where('category_id', $request->subcategory_id);
        }

        if ($request->has('min_price')) $query->where('price', '>=', $request->min_price);
        if ($request->has('max_price')) $query->where('price', '<=', $request->max_price);
        if ($request->has('location')) $query->where('location', 'LIKE', '%' . $request->location . '%');
        if ($request->has('condition')) $query->where('condition', $request->condition);

        switch ($request->sort) {
            case 'price_low': $query->orderBy('price', 'asc'); break;
            case 'price_high': $query->orderBy('price', 'desc'); break;
            case 'popular': $query->orderBy('views_count', 'desc'); break;
            case 'newest':
            default: $query->latest(); break;
        }

        $ads = $query->paginate(12);

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

        return response()->json(['success' => true, 'ads' => $ads]);
    }

    public function show($id)
    {
        $ad = Ad::with(['images', 'category', 'user' => function ($q) {
            $q->withCount('ads');
        }])->findOrFail($id);

        if ($ad->status !== 'active' && auth('api')->id() !== $ad->user_id && (!auth('api')->check() || !auth('api')->user()->isAdmin())) {
            return response()->json(['success' => false, 'message' => 'Ad not found or inactive'], 404);
        }

        if (!auth('api')->check() || auth('api')->id() !== $ad->user_id) {
            $ad->increment('views_count');
        }

        return response()->json([
            'success' => true,
            'ad' => [
                'id' => $ad->id,
                'title' => $ad->title,
                'description' => $ad->description,
                'price' => $ad->price,
                'location' => $ad->location,
                'condition' => $ad->condition,
                'status' => $ad->status,
                'views_count' => $ad->views_count,
                'category' => $ad->category,
                'images' => $ad->images,
                'seller' => [
                    'id' => $ad->user->id,
                    'name' => $ad->user->name,
                    'avatar_url' => $ad->user->avatar_url,
                    'city' => $ad->user->city,
                    'total_ads' => $ad->user->ads_count,
                    'member_since' => $ad->user->created_at,
                ]
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0.01',
            'category_id' => 'required|exists:categories,id',
            'location' => 'required|string|max:255',
            'condition' => 'required|in:new,used',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
            'images' => 'required|array|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $ad = Ad::create([
            'user_id' => auth()->id(),
            'category_id' => $request->category_id,
            'title' => $request->title,
            'description' => $request->description,
            'price' => $request->price,
            'location' => $request->location,
            'condition' => $request->condition,
            'status' => 'pending',
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $i => $file) {
                $upload = Cloudinary::upload($file->getRealPath(), ['folder' => 'ocas/ads']);
                AdImage::create([
                    'ad_id' => $ad->id,
                    'image_url' => $upload->getSecurePath(),
                    'cloudinary_public_id' => $upload->getPublicId(),
                    'is_primary' => $i === 0,
                    'sort_order' => $i,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'ad' => $ad->load('images')
        ]);
    }

    public function update(Request $request, $id)
    {
        $ad = Ad::findOrFail($id);

        if ($request->user()->cannot('update', $ad)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0.01',
            'category_id' => 'sometimes|exists:categories,id',
            'location' => 'sometimes|string|max:255',
            'condition' => 'sometimes|in:new,used',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048', // optional new images
            'deleted_image_ids' => 'sometimes|array',
            'deleted_image_ids.*' => 'exists:ad_images,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $ad->update($request->only('title', 'description', 'price', 'category_id', 'location', 'condition'));

        // Handle image deletions
        if ($request->has('deleted_image_ids')) {
            $imagesToDelete = AdImage::whereIn('id', $request->deleted_image_ids)->where('ad_id', $ad->id)->get();
            foreach ($imagesToDelete as $image) {
                if ($image->cloudinary_public_id) {
                    Cloudinary::destroy($image->cloudinary_public_id);
                }
                $image->delete();
            }
        }

        // Handle new images
        if ($request->hasFile('images')) {
            $currentImageCount = $ad->images()->count();
            $newFiles = $request->file('images');
            
            if ($currentImageCount + count($newFiles) > 10) {
                return response()->json(['success' => false, 'message' => 'Maximum 10 images allowed per ad'], 422);
            }

            foreach ($newFiles as $file) {
                $upload = Cloudinary::upload($file->getRealPath(), ['folder' => 'ocas/ads']);
                AdImage::create([
                    'ad_id' => $ad->id,
                    'image_url' => $upload->getSecurePath(),
                    'cloudinary_public_id' => $upload->getPublicId(),
                    'is_primary' => $ad->images()->where('is_primary', true)->exists() ? false : true,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'ad' => $ad->fresh('images')
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $ad = Ad::findOrFail($id);

        if ($request->user()->cannot('delete', $ad)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Delete all images from Cloudinary
        $images = $ad->images;
        foreach ($images as $image) {
            if ($image->cloudinary_public_id) {
                Cloudinary::destroy($image->cloudinary_public_id);
            }
        }

        $ad->delete();

        return response()->json(['success' => true, 'message' => 'Ad deleted successfully']);
    }

    public function markAsSold(Request $request, $id)
    {
        $ad = Ad::findOrFail($id);

        if ($request->user()->cannot('update', $ad)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $ad->update(['status' => 'sold']);

        return response()->json(['success' => true, 'message' => 'Ad marked as sold']);
    }

    public function myAds()
    {
        $ads = Ad::with(['images' => function($q) {
            $q->where('is_primary', true)->orWhere('sort_order', 0);
        }])->withCount('images')
        ->where('user_id', auth()->id())
        ->latest()
        ->paginate(12);

        $ads->getCollection()->transform(function ($ad) {
            $primaryImage = $ad->images->firstWhere('is_primary', true) ?? $ad->images->first();
            return [
                'id' => $ad->id,
                'title' => $ad->title,
                'price' => $ad->price,
                'status' => $ad->status,
                'views_count' => $ad->views_count,
                'images_count' => $ad->images_count,
                'primary_image' => $primaryImage ? $primaryImage->image_url : null,
                'created_at' => $ad->created_at,
            ];
        });

        return response()->json(['success' => true, 'ads' => $ads]);
    }

    public function report(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:5',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $ad = Ad::findOrFail($id);

        if ($ad->user_id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'You cannot report your own ad'], 403);
        }

        Report::create([
            'reporter_id' => auth()->id(),
            'ad_id' => $ad->id,
            'reason' => $request->reason,
            'status' => 'pending'
        ]);

        try {
            \Illuminate\Support\Facades\Mail::to('admin@ocas.com')
                ->send(new \App\Mail\NewReportMail($ad->title, auth()->user()->name, $request->reason));
        } catch (\Exception $e) {
            // Ignore mail failures so it doesn't crash the API response
        }

        return response()->json(['success' => true, 'message' => 'Ad reported successfully']);
    }
}
