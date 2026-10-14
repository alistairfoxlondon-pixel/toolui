<?php

namespace Tests\Feature;

use App\Models\CommunityChatMessage;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityFlowsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_a_member_can_sign_in_with_email_and_password(): void
    {
        $member = User::factory()->create(['username' => 'loginmaker']);

        $this->postJson('/login', [
            'email' => $member->email,
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('user.username', 'loginmaker');

        $this->assertAuthenticatedAs($member);
    }

    public function test_members_can_follow_and_update_their_username(): void
    {
        $member = User::factory()->create(['username' => 'makerone']);
        $other = User::factory()->create(['username' => 'makertwo']);

        $this->actingAs($member)
            ->postJson('/api/users/'.$other->id.'/follow')
            ->assertOk()
            ->assertJsonPath('isFollowing', true);

        $this->actingAs($member)
            ->putJson('/api/profile', [
                'name' => $member->name,
                'username' => 'freshmaker',
                'bio' => 'Building a small product.',
                'website' => null,
            ])
            ->assertOk()
            ->assertJsonPath('user.username', 'freshmaker');

        $this->getJson('/api/users/freshmaker')
            ->assertOk()
            ->assertJsonPath('user.username', 'freshmaker')
            ->assertJsonPath('user.followingCount', 1);
    }

    public function test_members_can_accept_friend_requests_and_message_each_other(): void
    {
        $sender = User::factory()->create(['username' => 'firstmaker']);
        $recipient = User::factory()->create(['username' => 'secondmaker']);

        $request = $this->actingAs($sender)
            ->postJson('/api/users/'.$recipient->id.'/friend-request')
            ->assertCreated()
            ->assertJsonPath('status', 'pending');

        $requestId = $request->json('friendRequestId');

        $this->actingAs($recipient)
            ->postJson('/api/friend-requests/'.$requestId.'/respond', ['response' => 'accept'])
            ->assertOk()
            ->assertJsonPath('status', 'accepted');

        $this->actingAs($sender)
            ->postJson('/api/messages/'.$recipient->id, ['body' => 'Hello, fellow maker.'])
            ->assertCreated()
            ->assertJsonPath('message.body', 'Hello, fellow maker.');

        $this->actingAs($recipient)
            ->getJson('/api/messages/'.$sender->id)
            ->assertOk()
            ->assertJsonPath('data.0.body', 'Hello, fellow maker.');
    }

    public function test_members_can_react_report_and_repost_visible_content(): void
    {
        $author = User::factory()->create(['username' => 'authorone']);
        $member = User::factory()->create(['username' => 'membertwo']);
        $post = Post::create([
            'user_id' => $author->id,
            'type' => 'discussion',
            'title' => 'A small launch lesson',
            'body' => 'Show the early version to people.',
        ]);

        $this->actingAs($member)
            ->postJson('/api/posts/'.$post->id.'/react', ['reaction' => 'helpful'])
            ->assertOk()
            ->assertJsonPath('myReaction', 'helpful');

        $this->actingAs($member)
            ->postJson('/api/posts/'.$post->id.'/report', ['reason' => 'other', 'details' => 'Needs a moderator review.'])
            ->assertCreated()
            ->assertJsonPath('ok', true);

        $this->actingAs($member)
            ->postJson('/api/posts/'.$post->id.'/repost')
            ->assertCreated()
            ->assertJsonPath('post.type', 'repost')
            ->assertJsonPath('post.sourcePost.id', (string) $post->id);
    }

    public function test_members_can_set_a_profession_skills_and_an_illustrated_avatar(): void
    {
        $member = User::factory()->create(['username' => 'profilemaker']);

        $this->actingAs($member)
            ->putJson('/api/profile', [
                'name' => $member->name,
                'username' => 'profilemaker',
                'bio' => 'Building small tools.',
                'profession' => 'AI developer',
                'skills' => ['PHP', 'Laravel', 'Product design'],
                'website' => null,
                'avatar_choice' => 'male-sky',
            ])
            ->assertOk()
            ->assertJsonPath('user.profession', 'AI developer')
            ->assertJsonPath('user.skills.0', 'PHP')
            ->assertJsonPath('user.avatarChoice', 'male-sky');

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'profession' => 'AI developer',
            'avatar_choice' => 'male-sky',
        ]);
    }

    public function test_launch_votes_toggle_and_ai_tools_appear_in_rankings(): void
    {
        $maker = User::factory()->create(['username' => 'toolmaker']);
        $voter = User::factory()->create(['username' => 'toolvoter']);
        $launch = Post::create([
            'user_id' => $maker->id,
            'type' => 'launch',
            'title' => 'PocketBrief',
            'body' => 'A small AI research workspace.',
            'launch_category' => 'ai_tool',
            'project_url' => 'https://example.test',
        ]);

        $this->actingAs($voter)
            ->postJson('/api/launches/'.$launch->id.'/vote', ['vote' => 1])
            ->assertOk()
            ->assertJsonPath('upvotes', 1)
            ->assertJsonPath('launchVote', 1);

        $this->actingAs($voter)
            ->postJson('/api/launches/'.$launch->id.'/vote', ['vote' => 1])
            ->assertOk()
            ->assertJsonPath('upvotes', 0)
            ->assertJsonPath('launchVote', null);

        $this->actingAs($voter)
            ->postJson('/api/launches/'.$launch->id.'/vote', ['vote' => -1])
            ->assertOk()
            ->assertJsonPath('downvotes', 1)
            ->assertJsonPath('launchVote', -1);

        $this->getJson('/api/rankings')
            ->assertOk()
            ->assertJsonPath('tools.0.title', 'PocketBrief')
            ->assertJsonPath('leaderboard.0.username', 'toolmaker');
    }

    public function test_members_can_read_and_send_community_chat_messages(): void
    {
        $member = User::factory()->create(['username' => 'chatmaker']);

        $sent = $this->actingAs($member)
            ->postJson('/api/community-chat', ['body' => 'I am building a small assistant.'])
            ->assertCreated()
            ->assertJsonPath('message.body', 'I am building a small assistant.')
            ->assertJsonPath('message.user.username', 'chatmaker');

        $messageId = $sent->json('message.id');

        $this->actingAs($member)
            ->getJson('/api/community-chat')
            ->assertOk()
            ->assertJsonPath('data.0.id', $messageId)
            ->assertJsonPath('data.0.sentByMe', true);

        $this->actingAs($member)
            ->getJson('/api/community-chat?after_id='.$messageId)
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_administrators_can_remove_community_chat_messages(): void
    {
        $member = User::factory()->create(['username' => 'chatposter']);
        $admin = User::factory()->create(['username' => 'chatadmin']);
        $admin->forceFill(['is_admin' => true])->save();
        $message = CommunityChatMessage::create([
            'user_id' => $member->id,
            'body' => 'A message for the moderation test.',
        ]);

        $this->actingAs($admin)
            ->delete('/admin/community-chat/'.$message->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('community_chat_messages', ['id' => $message->id]);
    }

    public function test_social_auth_returns_to_email_login_when_provider_is_not_configured(): void
    {
        config(['services.google.client_id' => null, 'services.google.client_secret' => null]);

        $this->get('/auth/google/redirect')
            ->assertRedirect('/login')
            ->assertSessionHas('auth_error');
    }

    public function test_only_administrators_can_open_the_moderation_panel(): void
    {
        $member = User::factory()->create(['username' => 'regularmaker']);
        $admin = User::factory()->create(['username' => 'siteadmin']);
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($member)->get('/admin')->assertForbidden();
        $this->actingAs($admin)->get('/admin')->assertOk();
    }
}
