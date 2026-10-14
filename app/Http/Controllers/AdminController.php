<?php

namespace App\Http\Controllers;

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
            'openReportCount' => PostReport::where('status', 'open')->count(),
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
        ]);
    }

    public function setPostVisibility(Request $request, Post $post): RedirectResponse
    {
        $data = $request->validate(['is_hidden' => ['required', 'boolean']]);
        $post->is_hidden = (bool) $data['is_hidden'];
        $post->save();

        return back()->with('status', $post->is_hidden ? 'Post hidden from the community.' : 'Post restored to the community.');
    }

    public function deletePost(Post $post): RedirectResponse
    {
        foreach ([$post->image_path, $post->logo_path] as $path) {
            if ($path) Storage::disk('public')->delete($path);
        }
        $post->delete();

        return back()->with('status', 'Post removed.');
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

    public function deleteCommunityChatMessage(CommunityChatMessage $message): RedirectResponse
    {
        $message->delete();

        return back()->with('status', 'Community chat message removed.');
    }
}
