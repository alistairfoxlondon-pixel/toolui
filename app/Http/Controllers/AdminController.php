<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\AiModel;
use App\Models\MessageReport;
use App\Models\DirectMessage;
use Illuminate\Support\Facades\DB;
use App\Models\CommunityChatMessage;
use App\Models\Post;
use App\Models\PostReport;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function index(): View
    {
        return view('admin.dashboard', [
            'memberCount' => User::count(),
            'activeMemberCount' => User::where('is_active', true)->count(),
            'postCount' => Post::count(),
            'launchCount' => Post::where('type', 'launch')->count(),
            'modelCount' => AiModel::count(),
            'aiModels' => AiModel::withCount('ratings')->orderBy('name')->get(),
            'commentCount' => Comment::count(),
            'openReportCount' => PostReport::where('status', 'open')->count() + MessageReport::where('status', 'open')->count(),
            'messageReports' => MessageReport::with(['reporter', 'reportedUser'])->where('status', 'open')->latest()->limit(50)->get(),
            'chatMessageCount' => CommunityChatMessage::count(),
            'chatMessages' => CommunityChatMessage::with('user:id,name,username')
                ->latest()
                ->limit(40)
                ->get(),
            'reports' => PostReport::with(['post.author', 'reporter'])
                ->where('status', 'open')
                ->latest()
                ->limit(30)
                ->get(),
            'users' => User::latest()->limit(40)->get(),
            'posts' => Post::with('author')->latest()->limit(30)->get(),
            'comments' => Comment::with(['author:id,name,username', 'post:id,title,body,is_hidden'])
                ->latest()
                ->limit(30)
                ->get(),
        ]);
    }

    public function setPostVisibility(Request $request, Post $post): RedirectResponse
    {
        $data = $request->validate(['is_hidden' => ['required', 'boolean']]);
        $post->is_hidden = (bool) $data['is_hidden'];
        $post->save();

        return back()->with('status', $post->is_hidden ? 'Post hidden from the community.' : 'Post restored to the community.');
    }

    public function setPostFeatured(Request $request, Post $post): RedirectResponse
    {
        $data = $request->validate(['is_featured' => ['required', 'boolean']]);
        $post->is_featured = (bool) $data['is_featured'];
        $post->save();

        return back()->with('status', $post->is_featured ? 'Post marked as a community pick.' : 'Community pick removed.');
    }

    public function deletePost(Post $post): RedirectResponse
    {
        foreach ([$post->image_path, $post->logo_path] as $path) {
            if ($path) Storage::disk('public')->delete($path);
        }
        $post->delete();

        return back()->with('status', 'Post removed.');
    }

    public function deleteComment(Comment $comment): RedirectResponse
    {
        $comment->delete();

        return back()->with('status', 'Comment removed.');
    }

    public function setUserStatus(Request $request, User $user): RedirectResponse
    {
        abort_if($user->id === $request->user()->id, 422, 'You cannot disable your own account.');
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $user->is_active = (bool) $data['is_active'];
        $user->save();

        return back()->with('status', $user->is_active ? 'Account restored.' : 'Account disabled.');
    }

    public function setAdminRole(Request $request, User $user): RedirectResponse
    {
        abort_if($user->id === $request->user()->id, 422, 'You cannot change your own administrator role.');
        $data = $request->validate(['is_admin' => ['required', 'boolean']]);
        $user->is_admin = (bool) $data['is_admin'];
        $user->save();

        return back()->with('status', $user->is_admin ? 'Administrator access granted.' : 'Administrator access removed.');
    }

    public function resolveReport(Request $request, PostReport $report): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', 'in:resolved,dismissed']]);
        $report->status = $data['status'];
        $report->reviewed_by = $request->user()->id;
        $report->reviewed_at = now();
        $report->save();

        return back()->with('status', $data['status'] === 'resolved' ? 'Report reviewed.' : 'Report dismissed.');
    }

    public function reviewMessageReport(Request $request, MessageReport $report): RedirectResponse
    {
        $data = $request->validate(['action' => ['required', 'in:hide,dismiss']]);
        DB::transaction(function () use ($request, $report, $data) {
            if ($data['action'] === 'hide') {
                $model = $report->message_type === 'direct' ? DirectMessage::class : CommunityChatMessage::class;
                $model::whereKey($report->message_id)->update(['is_hidden' => true]);
            }
            MessageReport::where('message_type', $report->message_type)->where('message_id', $report->message_id)->where('status', 'open')->update([
                'status' => $data['action'] === 'hide' ? 'resolved' : 'dismissed',
                'reviewed_by' => $request->user()->id, 'reviewed_at' => now(),
            ]);
        });
        return back()->with('status', 'Message report reviewed.');
    }

    public function deleteCommunityChatMessage(CommunityChatMessage $message): RedirectResponse
    {
        $message->delete();

        return back()->with('status', 'Community chat message removed.');
    }
}
