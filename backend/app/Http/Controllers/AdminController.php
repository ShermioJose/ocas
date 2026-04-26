<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\User;
use App\Models\Report;
use App\Mail\AdApprovedMail;
use App\Mail\AdRejectedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminController extends Controller
{
    public function dashboard()
    {
        $today = now()->startOfDay();
        
        // Ads this week aggregation
        $last7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $count = Ad::whereDate('created_at', $date)->count();
            $last7Days->push(['date' => $date, 'count' => $count]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => User::count(),
                'new_users_today' => User::where('created_at', '>=', $today)->count(),
                'total_ads' => Ad::count(),
                'pending_ads' => Ad::where('status', 'pending')->count(),
                'active_ads' => Ad::where('status', 'active')->count(),
                'total_reports' => Report::count(),
                'unresolved_reports' => Report::where('status', 'pending')->count(),
                'ads_this_week' => $last7Days,
            ]
        ]);
    }

    public function users(Request $request)
    {
        $query = User::withCount('ads');

        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('email', 'LIKE', '%' . $request->search . '%');
        }

        if ($request->has('status') && $request->status != '') {
            $status = $request->status === 'blocked' ? true : false;
            $query->where('is_blocked', $status);
        }

        $users = $query->latest()->paginate(12);

        return response()->json([
            'success' => true,
            'users' => $users
        ]);
    }

    public function toggleBlockUser($id)
    {
        $user = User::findOrFail($id);
        
        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Cannot block yourself'], 403);
        }

        $user->is_blocked = !$user->is_blocked;
        $user->save();

        if ($user->is_blocked) {
            // Ideally invalidate JWT, with jwt-auth we can invalidate token if we have it, 
            // but normally blocking prevents next login/auth middleware protects. 
            // Since we can't reliably get the specific user's active token globally without blacklisting logic,
            // the isBlocked logic inside endpoints will reject them using auth middleware checks in a complete app.
            // For now, setting is_blocked=true will stop their login access.
        }

        return response()->json([
            'success' => true,
            'user' => $user->fresh()
        ]);
    }

    public function suspendUser($id)
    {
        $user = User::findOrFail($id);
        
        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Cannot suspend yourself'], 403);
        }

        $user->is_blocked = true;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'User suspended successfully',
            'user' => $user->fresh()
        ]);
    }

    public function destroyUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete yourself'], 403);
        }

        $ads = $user->ads;
        foreach ($ads as $ad) {
            foreach ($ad->images as $image) {
                if ($image->cloudinary_public_id) {
                    Cloudinary::destroy($image->cloudinary_public_id);
                }
            }
        }
        
        if ($user->avatar_url && str_contains($user->avatar_url, 'cloudinary')) {
             $path = parse_url($user->avatar_url, PHP_URL_PATH);
             $parts = explode('/', $path);
             $last = end($parts);
             $publicId = 'ocas/avatars/' . explode('.', $last)[0];
             Cloudinary::destroy($publicId);
        }

        $user->delete(); // Cascades ads, wishlists, etc if DB is configured properly, otherwise eloquent cascade.

        return response()->json(['success' => true, 'message' => 'User and all associated data deleted']);
    }


    public function ads(Request $request)
    {
        $query = Ad::with(['user', 'category', 'images' => function($q) {
            $q->where('is_primary', true)->orWhere('sort_order', 0);
        }]);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $ads = $query->latest()->paginate(12);

        $ads->getCollection()->transform(function ($ad) {
            $primaryImage = $ad->images->firstWhere('is_primary', true) ?? $ad->images->first();
            return [
                'id' => $ad->id,
                'title' => $ad->title,
                'price' => $ad->price,
                'seller_name' => $ad->user->name,
                'status' => $ad->status,
                'views_count' => $ad->views_count,
                'created_at' => $ad->created_at,
                'primary_image' => $primaryImage ? $primaryImage->image_url : null,
            ];
        });

        return response()->json([
            'success' => true,
            'ads' => $ads
        ]);
    }

    public function approveAd($id)
    {
        $ad = Ad::with('user')->findOrFail($id);
        $ad->status = 'active';
        $ad->save();

        Mail::to($ad->user->email)->send(new AdApprovedMail($ad));

        return response()->json(['success' => true, 'message' => 'Ad approved']);
    }

    public function rejectAd(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $ad = Ad::with('user')->findOrFail($id);
        $ad->status = 'rejected';
        $ad->save();

        Mail::to($ad->user->email)->send(new AdRejectedMail($ad, $request->reason));

        return response()->json(['success' => true, 'message' => 'Ad rejected']);
    }

    public function destroyAd($id)
    {
        $ad = Ad::findOrFail($id);

        foreach ($ad->images as $image) {
            if ($image->cloudinary_public_id) {
                Cloudinary::destroy($image->cloudinary_public_id);
            }
        }

        $ad->delete();

        return response()->json(['success' => true, 'message' => 'Ad deleted completely']);
    }

    public function reports(Request $request)
    {
        $query = Report::with(['reporter', 'ad']);

        if ($request->has('status') && in_array($request->status, ['pending', 'resolved'])) {
            $query->where('status', $request->status);
        }

        $reports = $query->latest()->paginate(12);

        return response()->json(['success' => true, 'reports' => $reports]);
    }

    public function resolveReport(Request $request, $id)
    {
        $report = Report::findOrFail($id);
        $report->status = 'resolved';
        $report->save();

        if ($request->delete_ad && $report->ad) {
            $ad = $report->ad;
            foreach ($ad->images as $image) {
                if ($image->cloudinary_public_id) {
                    Cloudinary::destroy($image->cloudinary_public_id);
                }
            }
            $ad->delete();
        }

        return response()->json(['success' => true, 'message' => 'Report resolved']);
    }

    public function dismissReport($id)
    {
        $report = Report::findOrFail($id);
        $report->status = 'dismissed';
        $report->save();

        return response()->json(['success' => true, 'message' => 'Report dismissed']);
    }
}
