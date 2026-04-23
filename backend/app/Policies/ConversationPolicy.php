<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        return $user->id === $conversation->buyer_id || $user->id === $conversation->seller_id;
    }

    /**
     * Determine whether the user can send messages to the conversation.
     */
    public function sendMessages(User $user, Conversation $conversation): bool
    {
        return $user->id === $conversation->buyer_id || $user->id === $conversation->seller_id;
    }
}
