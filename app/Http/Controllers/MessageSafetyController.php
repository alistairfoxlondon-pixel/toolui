<?php

namespace App\Http\Controllers;

use App\Models\{CommunityChatMessage, DirectMessage, MessageReport, User, UserBlock};
use App\Support\PostPresenter;
use Illuminate\Http\{JsonResponse, Request};

class MessageSafetyController extends Controller
{
    public function blocks(Request $request): JsonResponse
    {
        return response()->json(['data' => User::whereIn('id', UserBlock::where('blocker_id', $request->user()->id)->select('blocked_id'))->get()->map(fn ($user) => PostPresenter::userSummary($user))]);
    }

    public function block(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot block yourself.');
        UserBlock::firstOrCreate(['blocker_id' => $request->user()->id, 'blocked_id' => $user->id]);
        return response()->json(['blocked' => true]);
    }

    public function unblock(Request $request, User $user): JsonResponse
    {
        UserBlock::where('blocker_id', $request->user()->id)->where('blocked_id', $user->id)->delete();
        return response()->json(['blocked' => false]);
    }

    public function report(Request $request, string $type, int $message): JsonResponse
    {
        abort_unless(in_array($type, ['direct', 'community'], true), 404);
        $item = $type === 'direct' ? DirectMessage::findOrFail($message) : CommunityChatMessage::findOrFail($message);
        $viewer = (int) $request->user()->id;
        // A member may report only DMs they received. Never expose a stranger's private message.
        if ($type === 'direct') abort_unless((int) $item->recipient_id === $viewer, 404);
        $author = (int) ($type === 'direct' ? $item->sender_id : $item->user_id);
        abort_if($author === $viewer, 422, 'You cannot report your own message.');
        $data = $request->validate([
            'reason' => ['required', 'in:hate,harassment,threat,spam,other'],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);
        MessageReport::firstOrCreate(
            ['reporter_id' => $viewer, 'message_type' => $type, 'message_id' => $item->id],
            ['reported_user_id' => $author, 'reported_body' => $item->body, 'reason' => $data['reason'], 'details' => $data['details'] ?? null]
        );
        return response()->json(['message' => 'Report received. A moderator will review it.'], 201);
    }
}
