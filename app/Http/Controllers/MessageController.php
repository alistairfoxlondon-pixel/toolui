<?php

namespace App\Http\Controllers;

use App\Models\{DirectMessage, User, UserBlock};
use App\Support\{ContentModeration, PostPresenter};
use Illuminate\Http\{JsonResponse, Request};

class MessageController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        $id = (int) $request->user()->id;
        $latestIds = DirectMessage::where(fn ($q) => $q->where('sender_id', $id)->orWhere('recipient_id', $id))
            ->where('is_hidden', false)
            ->selectRaw('MAX(id) AS id')
            ->groupByRaw('CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END', [$id]);
        $blocked = UserBlock::excludedIds($id);
        $unread = DirectMessage::where('recipient_id', $id)->where('is_hidden', false)->whereNull('read_at')
            ->selectRaw('sender_id, COUNT(*) AS total')->groupBy('sender_id')->pluck('total', 'sender_id');
        $data = DirectMessage::with(['sender', 'recipient'])->whereIn('id', $latestIds)->latest('id')->limit(100)->get()
            ->filter(fn ($m) => ((int) $m->sender_id === $id ? $m->recipient : $m->sender)?->is_active)
            ->map(function ($m) use ($id, $blocked, $unread) {
                $peer = (int) $m->sender_id === $id ? $m->recipient : $m->sender;
                return ['user' => PostPresenter::userSummary($peer), 'messagingBlocked' => in_array((int) $peer->id, $blocked),
                    'latestMessage' => ['body' => $m->body, 'createdAt' => $m->created_at->diffForHumans(), 'sentByMe' => (int) $m->sender_id === $id],
                    'unreadCount' => (int) ($unread[$peer->id] ?? 0)];
            })->values();
        return response()->json(['data' => $data]);
    }

    public function thread(Request $request, User $user): JsonResponse
    {
        $viewer = $request->user();
        abort_if($viewer->is($user) || ! $user->is_active, 404);
        DirectMessage::where('sender_id', $user->id)->where('recipient_id', $viewer->id)->whereNull('read_at')->update(['read_at' => now()]);
        $messages = DirectMessage::with('sender')->where('is_hidden', false)
            ->where(fn ($q) => $q
                ->where(fn ($p) => $p->where('sender_id', $viewer->id)->where('recipient_id', $user->id))
                ->orWhere(fn ($p) => $p->where('sender_id', $user->id)->where('recipient_id', $viewer->id)))
            ->latest('id')->limit(100)->get()->reverse()->values();
        return response()->json([
            'user' => PostPresenter::userSummary($user),
            'messagingBlocked' => UserBlock::between($viewer->id, $user->id),
            'blockedByMe' => UserBlock::where('blocker_id', $viewer->id)->where('blocked_id', $user->id)->exists(),
            'data' => $messages->map(fn ($m) => $this->present($m, $viewer->id)),
        ]);
    }

    public function send(Request $request, User $user): JsonResponse
    {
        $viewer = $request->user();
        abort_if($viewer->is($user) || ! $user->is_active, 404);
        abort_if(UserBlock::between($viewer->id, $user->id), 403, 'Messaging is unavailable between these accounts.');
        $data = $request->validate(['body' => ['required', 'string', 'min:1', 'max:2000']]);
        $body = trim($data['body']);
        abort_if($body === '', 422, 'Enter a message.');
        ContentModeration::check($body);
        $message = DirectMessage::create(['sender_id' => $viewer->id, 'recipient_id' => $user->id, 'body' => $body]);
        return response()->json(['message' => $this->present($message->load('sender'), $viewer->id)], 201);
    }

    private function present(DirectMessage $message, int $viewer): array
    {
        return ['id' => $message->id, 'body' => $message->body, 'createdAt' => $message->created_at->diffForHumans(),
            'sentByMe' => (int) $message->sender_id === $viewer, 'sender' => PostPresenter::userSummary($message->sender)];
    }
}
