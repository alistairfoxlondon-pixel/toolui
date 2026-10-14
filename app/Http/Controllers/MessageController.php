<?php

namespace App\Http\Controllers;

use App\Models\DirectMessage;
use App\Models\FriendRequest;
use App\Models\User;
use App\Support\PostPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $friendIds = FriendRequest::query()
            ->where('status', 'accepted')
            ->where(fn ($query) => $query->where('sender_id', $userId)->orWhere('recipient_id', $userId))
            ->get()
            ->map(fn (FriendRequest $friend) => (int) ($friend->sender_id === $userId ? $friend->recipient_id : $friend->sender_id))
            ->unique()
            ->values();

        $friends = User::query()
            ->whereIn('id', $friendIds)
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function (User $friend) use ($userId) {
                $latest = DirectMessage::query()
                    ->where(fn ($query) => $query
                        ->where('sender_id', $userId)->where('recipient_id', $friend->id))
                    ->orWhere(fn ($query) => $query
                        ->where('sender_id', $friend->id)->where('recipient_id', $userId))
                    ->latest()
                    ->first();

                $unread = DirectMessage::query()
                    ->where('sender_id', $friend->id)
                    ->where('recipient_id', $userId)
                    ->whereNull('read_at')
                    ->count();

                return [
                    'user' => PostPresenter::userSummary($friend),
                    'latestMessage' => $latest ? [
                        'body' => $latest->body,
                        'createdAt' => $latest->created_at->diffForHumans(),
                        'sentByMe' => (int) $latest->sender_id === (int) $userId,
                    ] : null,
                    'unreadCount' => $unread,
                ];
            });

        return response()->json(['data' => $friends]);
    }

    public function thread(Request $request, User $user): JsonResponse
    {
        $this->ensureFriends($request->user(), $user);
        $senderId = $request->user()->id;
        $recipientId = $user->id;

        DirectMessage::query()
            ->where('sender_id', $recipientId)
            ->where('recipient_id', $senderId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = DirectMessage::query()
            ->with('sender:id,name,username,avatar_path')
            ->where(fn ($query) => $query
                ->where('sender_id', $senderId)->where('recipient_id', $recipientId))
            ->orWhere(fn ($query) => $query
                ->where('sender_id', $recipientId)->where('recipient_id', $senderId))
            ->orderBy('id')
            ->limit(100)
            ->get()
            ->map(fn (DirectMessage $message) => [
                'id' => $message->id,
                'body' => $message->body,
                'createdAt' => $message->created_at->diffForHumans(),
                'sentByMe' => (int) $message->sender_id === (int) $senderId,
                'sender' => PostPresenter::userSummary($message->sender),
            ]);

        return response()->json([
            'user' => PostPresenter::userSummary($user),
            'data' => $messages,
        ]);
    }

    public function send(Request $request, User $user): JsonResponse
    {
        $this->ensureFriends($request->user(), $user);
        $data = $request->validate(['body' => ['required', 'string', 'min:1', 'max:2000']]);

        $message = DirectMessage::create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $user->id,
            'body' => $data['body'],
        ]);
        $message->load('sender:id,name,username,avatar_path');

        return response()->json([
            'message' => [
                'id' => $message->id,
                'body' => $message->body,
                'createdAt' => $message->created_at->diffForHumans(),
                'sentByMe' => true,
                'sender' => PostPresenter::userSummary($message->sender),
            ],
        ], 201);
    }

    private function ensureFriends(User $first, User $second): void
    {
        abort_if($first->id === $second->id || ! $second->is_active, 404);
        $areFriends = FriendRequest::query()
            ->where('status', 'accepted')
            ->where(fn ($query) => $query
                ->where(fn ($pair) => $pair->where('sender_id', $first->id)->where('recipient_id', $second->id))
                ->orWhere(fn ($pair) => $pair->where('sender_id', $second->id)->where('recipient_id', $first->id)))
            ->exists();

        abort_unless($areFriends, 403, 'Send and accept a friend request before messaging.');
    }
}
