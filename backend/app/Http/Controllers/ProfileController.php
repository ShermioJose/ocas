<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class ProfileController extends Controller
{
    public function getProfile()
    {
        $user = auth('api')->user();

        return response()->json([
            'success' => true,
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'city' => $user->city,
                'bio' => $user->bio,
                'avatar_url' => $user->avatar_url,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'city' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();
        
        $user->update($request->only('name', 'phone', 'city', 'bio'));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'profile' => $user->fresh()->only('id', 'name', 'email', 'phone', 'city', 'bio', 'avatar_url', 'role', 'created_at')
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();

        try {
            // Check if user has an existing avatar, optional to delete from cloudinary if stored public ID
            // Here we assume avatar_url maps directly. Since cloudinary returns full URL, extract public_id to destroy.
            if ($user->avatar_url && str_contains($user->avatar_url, 'cloudinary')) {
                // simple extraction logic for Cloudinary public ID if needed
                $path = parse_url($user->avatar_url, PHP_URL_PATH);
                $parts = explode('/', $path);
                $last = end($parts);
                $publicId = 'ocas/avatars/' . explode('.', $last)[0];
                Cloudinary::destroy($publicId);
            }

            $uploadedFileUrl = Cloudinary::upload($request->file('avatar')->getRealPath(), [
                'folder' => 'ocas/avatars'
            ])->getSecurePath();

            $user->update(['avatar_url' => $uploadedFileUrl]);

            return response()->json([
                'success' => true,
                'avatar_url' => $uploadedFileUrl
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Image upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function getPublicProfile($id)
    {
        $user = User::withCount(['ads as active_ads_count' => function ($query) {
            $query->where('status', 'active');
        }])->find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        return response()->json([
            'success' => true,
            'profile' => [
                'name' => $user->name,
                'avatar_url' => $user->avatar_url,
                'city' => $user->city,
                'created_at' => $user->created_at,
                'total_active_ads_count' => $user->active_ads_count,
            ]
        ]);
    }
}
