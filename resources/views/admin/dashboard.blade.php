<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>VibeDock Admin</title>
    @vite('resources/js/admin.js')
</head>
<body class="admin-page">
    <div class="admin-shell">
        <aside class="admin-sidebar">
            <a class="admin-brand" href="/">VibeDock <span>Admin</span></a>
            <p class="admin-sidebar-label">CONTROL ROOM</p>
            <a class="admin-sidebar-link active" href="/admin">Overview</a>
            <a class="admin-sidebar-link" href="#reports">Reports <span>{{ $openReportCount }}</span></a>
            <a class="admin-sidebar-link" href="#members">Members</a>
            <a class="admin-sidebar-link" href="#posts">Posts and launches</a>
            <a class="admin-sidebar-link" href="#chat">Community chat <span>{{ $chatMessageCount }}</span></a>
            <a class="admin-return" href="/">Return to community</a>
        </aside>
        <main class="admin-main">
            <header class="admin-header"><div><p>VIBEDOCK CONTROL ROOM</p><h1>Community overview</h1><span>Manage members, posts, launches, and reports.</span></div><div class="admin-user">{{ auth()->user()->name }} <span>Administrator</span></div></header>
            @if (session('status'))<div class="admin-flash">{{ session('status') }}</div>@endif
            <section class="admin-stats">
                <article><span>Members</span><strong>{{ number_format($memberCount) }}</strong><small>{{ number_format($activeMemberCount) }} active</small></article>
                <article><span>Community posts</span><strong>{{ number_format($postCount) }}</strong><small>All post types</small></article>
                <article><span>Launches</span><strong>{{ number_format($launchCount) }}</strong><small>Project showcases</small></article>
                <article><span>Open reports</span><strong>{{ number_format($openReportCount) }}</strong><small>Needs review</small></article>
                <article><span>Community messages</span><strong>{{ number_format($chatMessageCount) }}</strong><small>Group chat</small></article>
            </section>

            <section class="admin-panel" id="reports"><div class="admin-panel-heading"><div><p>MODERATION</p><h2>Reports to review</h2></div><span>{{ $reports->count() }} open</span></div>
                @forelse ($reports as $report)
                    <article class="admin-report"><div class="admin-report-main"><strong>{{ $report->reason }}</strong><span>Reported by {{ $report->reporter?->name ?? 'Former member' }} · {{ $report->created_at->diffForHumans() }}</span><p>{{ $report->details ?: 'No extra details provided.' }}</p><div class="admin-report-post">{{ $report->post?->title ?: $report->post?->body ?: 'Post unavailable' }} <small>by {{ $report->post?->author?->name ?? 'Former member' }}</small></div></div><div class="admin-report-actions"><form method="POST" action="{{ route('admin.reports.review', $report) }}">@csrf<input type="hidden" name="status" value="resolved"><button class="admin-button primary" type="submit">Resolve</button></form><form method="POST" action="{{ route('admin.reports.review', $report) }}">@csrf<input type="hidden" name="status" value="dismissed"><button class="admin-button" type="submit">Dismiss</button></form></div></article>
                @empty
                    <div class="admin-empty">No open reports. The community is all clear.</div>
                @endforelse
            </section>

            <section class="admin-panel" id="members"><div class="admin-panel-heading"><div><p>MEMBERS</p><h2>Latest accounts</h2></div></div>
                <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Member</th><th>Email</th><th>Access</th><th>Account</th><th>Controls</th></tr></thead><tbody>
                    @foreach ($users as $member)
                        <tr><td><strong>{{ $member->name }}</strong><small>{{ '@'.$member->username }}</small></td><td>{{ $member->email }}</td><td>{{ $member->is_admin ? 'Administrator' : 'Member' }}</td><td>{{ $member->is_active ? 'Active' : 'Disabled' }}</td><td class="admin-row-actions">
                            @if ($member->id !== auth()->id())
                                <form method="POST" action="{{ route('admin.users.role', $member) }}">@csrf @method('PATCH')<input type="hidden" name="is_admin" value="{{ $member->is_admin ? 0 : 1 }}"><button class="admin-button" type="submit">{{ $member->is_admin ? 'Remove admin' : 'Make admin' }}</button></form>
                                <form method="POST" action="{{ route('admin.users.status', $member) }}">@csrf @method('PATCH')<input type="hidden" name="is_active" value="{{ $member->is_active ? 0 : 1 }}"><button class="admin-button {{ $member->is_active ? 'danger' : '' }}" type="submit">{{ $member->is_active ? 'Disable' : 'Restore' }}</button></form>
                            @else <span>Current account</span> @endif
                        </td></tr>
                    @endforeach
                </tbody></table></div>
            </section>

            <section class="admin-panel" id="chat"><div class="admin-panel-heading"><div><p>COMMUNITY CHAT</p><h2>Recent messages</h2></div><span>{{ $chatMessageCount }} total</span></div>
                @forelse ($chatMessages as $message)
                    <article class="admin-chat-row"><div><strong>{{ $message->user?->name ?? 'Former member' }}</strong><span>{{ $message->created_at->diffForHumans() }}</span><p>{{ $message->body }}</p></div><form method="POST" action="{{ route('admin.community-chat.delete', $message) }}" onsubmit="return confirm('Remove this community chat message?')">@csrf @method('DELETE')<button class="admin-button danger" type="submit">Remove</button></form></article>
                @empty
                    <div class="admin-empty">No community chat messages yet.</div>
                @endforelse
            </section>

            <section class="admin-panel" id="posts"><div class="admin-panel-heading"><div><p>CONTENT</p><h2>Recent posts and launches</h2></div></div>
                <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Post</th><th>Member</th><th>Type</th><th>Visibility</th><th>Controls</th></tr></thead><tbody>
                    @foreach ($posts as $post)
                        <tr><td><strong>{{ $post->title ?: \Illuminate\Support\Str::limit($post->body, 70) }}</strong><small>{{ $post->created_at->diffForHumans() }}</small></td><td>{{ $post->author?->name ?? 'Former member' }}</td><td>{{ ucfirst($post->type) }}</td><td>{{ $post->is_hidden ? 'Hidden' : 'Visible' }}</td><td class="admin-row-actions"><form method="POST" action="{{ route('admin.posts.visibility', $post) }}">@csrf @method('PATCH')<input type="hidden" name="is_hidden" value="{{ $post->is_hidden ? 0 : 1 }}"><button class="admin-button" type="submit">{{ $post->is_hidden ? 'Restore' : 'Hide' }}</button></form><form method="POST" action="{{ route('admin.posts.delete', $post) }}" onsubmit="return confirm('Permanently remove this post?')">@csrf @method('DELETE')<button class="admin-button danger" type="submit">Delete</button></form></td></tr>
                    @endforeach
                </tbody></table></div>
            </section>
        </main>
    </div>
</body>
</html>
