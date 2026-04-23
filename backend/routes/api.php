<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ConversationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// ==========================================
// Health & Authentication (Public)
// ==========================================
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'OCAS',
        'timestamp' => now()
    ]);
});

Route::group(['prefix' => 'auth'], function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::get('/users/{id}', [ProfileController::class, 'getPublicProfile']);

// ==========================================
// Categories & Ads (Public)
// ==========================================
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}/ads', [CategoryController::class, 'getAdsBySlug']);
Route::get('/ads', [AdController::class, 'index']);
Route::get('/ads/{id}', [AdController::class, 'show']);

// ==========================================
// Authenticated User Routes (auth:api)
// ==========================================
Route::group(['middleware' => 'auth:api'], function () {

    // Auth & Profile
    Route::group(['prefix' => 'auth'], function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    Route::group(['prefix' => 'profile'], function () {
        Route::get('/', [ProfileController::class, 'getProfile']);
        Route::put('/', [ProfileController::class, 'updateProfile']);
        Route::post('/avatar', [ProfileController::class, 'uploadAvatar']);
    });

    // Ads creation & management
    Route::post('/ads', [AdController::class, 'store']);
    Route::put('/ads/{id}', [AdController::class, 'update']);
    Route::delete('/ads/{id}', [AdController::class, 'destroy']);
    Route::post('/ads/{id}/sold', [AdController::class, 'markAsSold']);
    Route::post('/ads/{id}/report', [AdController::class, 'report']);
    Route::get('/my-ads', [AdController::class, 'myAds']);

    // Wishlist
    Route::group(['prefix' => 'wishlist'], function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::post('/{ad_id}', [WishlistController::class, 'toggleWishlist']);
        Route::delete('/{ad_id}', [WishlistController::class, 'destroy']);
        Route::get('/check/{ad_id}', [WishlistController::class, 'check']);
    });

    // Conversations / Chat
    Route::group(['prefix' => 'conversations'], function () {
        Route::post('/', [ConversationController::class, 'store']);
        Route::get('/', [ConversationController::class, 'index']);
        Route::get('/{id}/messages', [ConversationController::class, 'messages']);
        
        // This accepts socket origin fallback via secret locally validated in controller
        Route::post('/{id}/messages', [ConversationController::class, 'sendMessage']);
    });
});

// Note: Conversation send message endpoint has logic to let socket server hit it without JWT
// It's registered under auth middleware above normally, but realistically the socket 
// validation logic should override or bypass. Since it's inside `auth:api`, we should actually 
// exclude the POST send message from strictly requiring `auth:api` if it's hit from sockets.
// So let's extract the POST messages out of the auth group to allow the X-Socket-Secret check manually.
Route::post('/conversations/{id}/messages', [ConversationController::class, 'sendMessage']);

// ==========================================
// Admin Module (auth:api + admin policy)
// ==========================================
Route::group(['prefix' => 'admin', 'middleware' => ['auth:api', 'admin']], function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    
    // User management
    Route::get('/users', [AdminController::class, 'users']);
    Route::put('/users/{id}/toggle-block', [AdminController::class, 'toggleBlockUser']);
    Route::delete('/users/{id}', [AdminController::class, 'destroyUser']);
    
    // Ad management
    Route::get('/ads', [AdminController::class, 'ads']);
    Route::post('/ads/{id}/approve', [AdminController::class, 'approveAd']);
    Route::post('/ads/{id}/reject', [AdminController::class, 'rejectAd']);
    Route::delete('/ads/{id}', [AdminController::class, 'destroyAd']);

    // Reports
    Route::get('/reports', [AdminController::class, 'reports']);
    Route::post('/reports/{id}/resolve', [AdminController::class, 'resolveReport']);
});
