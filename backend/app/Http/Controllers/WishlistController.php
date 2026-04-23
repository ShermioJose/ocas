<?php

namespace App\Http\Controllers;

use App\Models\Wishlist;
use App\Models\Ad;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index()
    {
        $wishlists = Wishlist::with(['ad' => function ($q) {
            $q->where('status', 'active')->with(['images' => function ($img) {
                $img->where('is_primary', true)->orWhere('sort_order', 0);
            }]);
        }])
        ->where('user_id', auth()->id())
        ->get();

        $items = $wishlists->map(function ($w) {
            if (!$w->ad) return null; // skipped if not active
            
            $primaryImage = $w->ad->images->firstWhere('is_primary', true) ?? $w->ad->images->first();

            return [
                'id' => $w->ad->id,
                'title' => $w->ad->title,
                'price' => $w->ad->price,
                'primary_image' => $primaryImage ? $primaryImage->image_url : null,
            ];
        })->filter()->values();

        return response()->json([
            'success' => true,
            'wishlist' => $items
        ]);
    }

    public function toggleWishlist($ad_id)
    {
        $ad = Ad::findOrFail($ad_id);

        if ($ad->user_id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Cannot wishlist own ad'], 403);
        }

        $wishlist = Wishlist::where('user_id', auth()->id())
                            ->where('ad_id', $ad_id)
                            ->first();

        if (!$wishlist) {
            Wishlist::create([
                'user_id' => auth()->id(),
                'ad_id' => $ad_id
            ]);
            return response()->json(['success' => true, 'wishlisted' => true]);
        }

        return response()->json(['success' => true, 'wishlisted' => true]); // Requirement: "if already exists, return success without duplicate"
    }

    public function destroy($ad_id)
    {
        Wishlist::where('user_id', auth()->id())
                ->where('ad_id', $ad_id)
                ->delete();

        return response()->json(['success' => true, 'wishlisted' => false]);
    }

    public function check($ad_id)
    {
        $exists = Wishlist::where('user_id', auth()->id())
                          ->where('ad_id', $ad_id)
                          ->exists();

        return response()->json(['success' => true, 'wishlisted' => $exists]);
    }
}
