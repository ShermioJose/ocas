<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Ad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ConversationController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ad_id' => 'required|exists:ads,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $ad = Ad::find($request->ad_id);
        $buyerId = auth()->id();
        $sellerId = $ad->user_id;

        if ($buyerId === $sellerId) {
            return response()->json(['success' => false, 'message' => 'Cannot start conversation with yourself'], 403);
        }

        $conversation = Conversation::firstOrCreate([
            'ad_id' => $ad->id,
            'buyer_id' => $buyerId,
            'seller_id' => $sellerId,
        ]);

        $conversation->load('ad');

        return response()->json([
            'success' => true,
            'conversation' => $conversation
        ]);
    }

    public function index()
    {
        $userId = auth()->id();
        $conversations = Conversation::with(['ad', 'buyer', 'seller', 'messages' => function ($q) {
            $q->latest()->limit(1);
        }])
        ->where('buyer_id', $userId)
        ->orWhere('seller_id', $userId)
        ->orderByDesc('last_message_at')
        ->get();

        $formatted = $conversations->map(function ($conv) use ($userId) {
            $otherUser = $conv->buyer_id === $userId ? $conv->seller : $conv->buyer;
            $lastMessage = $conv->messages->first();
            
            // Primary image logic fallback
            $primaryImage = null;
            if ($conv->ad) {
               $primaryImage = \App\Models\AdImage::where('ad_id', $conv->ad->id)->where('is_primary', true)->value('image_url') 
                                ?? \App\Models\AdImage::where('ad_id', $conv->ad->id)->value('image_url');
            }

            return [
                'id' => $conv->id,
                'other_user' => [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'avatar_url' => $otherUser->avatar_url,
                ],
                'ad' => [
                    'id' => $conv->ad ? $conv->ad->id : null,
                    'title' => $conv->ad ? $conv->ad->title : 'Deleted Ad',
                    'primary_image' => $primaryImage,
                ],
                'last_message' => $lastMessage ? $lastMessage->message : null,
                'unread_count' => $conv->messages()->where('sender_id', '!=', $userId)->where('is_read', false)->count(),
                'last_message_at' => $conv->last_message_at,
            ];
        });

        return response()->json(['success' => true, 'conversations' => $formatted]);
    }

    public function messages(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);

        if ($request->user()->cannot('view', $conversation)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $messages = $conversation->messages()->latest()->paginate(50);
        
        // Mark as read
        $conversation->messages()->where('sender_id', '!=', auth()->id())->where('is_read', false)->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'messages' => $messages
        ]);
    }

    public function sendMessage(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        
        // Security logic allowing auth user OR socket proxy via secret header
        $isSocketOrigin = false;
        if ($request->header('X-Socket-Secret')) {
            if ($request->header('X-Socket-Secret') !== env('SOCKET_SECRET')) {
                // If it's not matching socket block, allow fallback to auth checks below if token provided
                // For safety, let's just use SOCKET_SERVER_URL mapping for the secret as placeholders.
            } else {
                $isSocketOrigin = true;
            }
        }

        if (!$isSocketOrigin) {
           if (!auth()->check()) {
               return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
           }
           if (auth()->user()->cannot('sendMessages', $conversation)) {
               return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
           }
           // Use auth id if originating standard HTTP request
           $senderId = auth()->id();
        } else {
           $senderId = $request->sender_id;
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string',
            'sender_id' => 'required_if:X-Socket-Secret,exists' // Simplified checking
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $senderId ?? $request->sender_id,
            'message' => $request->message,
            'is_read' => false
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => $message
        ]);
    }
}
