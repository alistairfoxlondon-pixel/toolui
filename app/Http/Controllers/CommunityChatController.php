<?php

namespace App\Http\Controllers;

use App\Models\CommunityChatMessage;
use App\Support\PostPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityChatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $afterId = max(0, (int) $request->query('after_id', 0));
        $query = CommunityChatMessage::query()
            ->with('user:id,name,username,bio,profession,skills,website,avatar_path,avatar_choice,is_admin')
            ->whereHas('user', fn ($users) => $users->where('is_active', true));

        if ($afterId > 0) {
            $messages = $query->where('id', '>', $afterId)->orderBy('id')->limit(80)->get();
        } else {
            $messages = $query->latest('id')->limit(80)->get()->reverse()->values();
        }

        return response()->json(['data' => $messages->map(fn (CommunityChatMessage $message) => $this->present($message, $request))->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'min:1', 'max:500']]);
        $message = CommunityChatMessage::create([
            'user_id' => $request->user()->id,
            'body' => trim($data['body']),
        ]);
        $message->load('user:id,name,username,bio,profession,skills,website,avatar_path,avatar_choice,is_admin');

        return response()->json(['message' => $this->present($message, $request)], 201);
    }

    private function present(CommunityChatMessage $message, Request $request): array
    {
        return [
            'id' => (int) $message->id,
            'body' => $message->body,
            'createdAt' => $message->created_at?->diffForHumans() ?? 'just now',
            'sentByMe' => (int) $message->user_id === (int) $request->user()->id,
            'user' => PostPresenter::userSummary($message->user),
        ];
    }
}
