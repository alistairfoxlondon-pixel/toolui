<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityRefinementTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_the_rotated_csrf_token_and_profile_website_survives_reload(): void
    {
        $user = User::factory()->create(['website' => 'https://my-project.example']);
        $this->postJson('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()->assertJsonStructure(['user', 'csrfToken'])
            ->assertJsonPath('csrfToken', session()->token());
        $this->get('/settings/profile')->assertOk()->assertSee('my-project.example', false);
    }

    public function test_single_post_endpoint_resolves_old_launches_and_respects_visibility(): void
    {
        $user = User::factory()->create();
        $post = Post::create(['user_id' => $user->id, 'type' => 'launch', 'title' => 'Old launch',
            'body' => 'My app', 'seo_description' => 'A useful launch description.', 'project_url' => 'https://example.com']);
        $post->forceFill(['created_at' => now()->subDays(90)])->save();
        for ($i = 0; $i < 61; $i++) {
            Post::create(['user_id' => $user->id, 'type' => 'discussion', 'body' => 'A newer post.']);
        }
        $this->assertNotContains((string) $post->id, array_column($this->getJson('/api/feed')->json('data'), 'id'));
        $this->getJson('/api/posts/'.$post->id)->assertOk()->assertJsonPath('post.title', 'Old launch');
        $this->get('/posts/'.$post->id)->assertOk()->assertSee('A useful launch description.');
        $post->update(['is_hidden' => true]);
        $this->getJson('/api/posts/'.$post->id)->assertNotFound();
        $post->update(['is_hidden' => false, 'type' => 'model']);
        $this->getJson('/api/posts/'.$post->id)->assertNotFound();
        $post->update(['type' => 'launch']);
        $user->update(['is_active' => false]);
        $this->getJson('/api/posts/'.$post->id)->assertNotFound();
    }

    public function test_single_repost_does_not_expose_a_hidden_source(): void
    {
        $user = User::factory()->create();
        $source = Post::create(['user_id' => $user->id, 'type' => 'discussion', 'body' => 'Hidden.', 'is_hidden' => true]);
        $repost = Post::create(['user_id' => $user->id, 'type' => 'repost', 'source_post_id' => $source->id]);
        $this->getJson('/api/posts/'.$repost->id)->assertNotFound();
    }

    public function test_poll_options_must_be_distinct_and_launch_links_must_be_web_urls(): void
    {
        $this->actingAs(User::factory()->create());
        $this->postJson('/api/posts', ['type' => 'poll', 'title' => 'What next?', 'options' => ['App', 'app']])
            ->assertUnprocessable()->assertJsonValidationErrors('options.0');
        $this->postJson('/api/posts', ['type' => 'launch', 'title' => 'App', 'body' => 'A project.', 'project_url' => 'ftp://example.com'])
            ->assertUnprocessable()->assertJsonValidationErrors('project_url');
    }

    public function test_engagement_aggregates_do_not_multiply_likes_and_comments(): void
    {
        $author = User::factory()->create();
        $member = User::factory()->create();
        $other = User::factory()->create();
        $inactive = User::factory()->create(['is_active' => false]);
        $post = Post::create(['user_id' => $author->id, 'type' => 'discussion', 'body' => 'Public post']);
        $post->likes()->attach([$member->id, $other->id, $inactive->id]);
        foreach ([$member, $other, $member, $inactive] as $commenter) {
            Comment::create(['user_id' => $commenter->id, 'post_id' => $post->id, 'body' => 'Useful feedback.']);
        }
        $hidden = Post::create(['user_id' => $other->id, 'type' => 'discussion', 'body' => 'Hidden', 'is_hidden' => true]);
        Comment::create(['user_id' => $member->id, 'post_id' => $hidden->id, 'body' => 'Not counted.']);
        $leaders = collect($this->getJson('/api/rankings')->assertOk()->json('leaderboard'))->keyBy('id');
        $this->assertSame(1, $leaders[$author->id]['postsCount']);
        $this->assertSame(2, $leaders[$author->id]['likesReceived']);
        $this->assertSame(3, $leaders[$author->id]['commentsReceived']);
        $this->assertSame(14, $leaders[$author->id]['score']);
        $this->assertSame(2, $leaders[$member->id]['commentsWritten']);
        $this->assertFalse($leaders->has($inactive->id));
    }
    public function test_feed_loads_only_viewer_like_membership_and_keeps_source_totals(): void
    {
        $author = User::factory()->create();
        $viewer = User::factory()->create();
        $other = User::factory()->create();
        $source = Post::create(['user_id' => $author->id, 'type' => 'discussion', 'body' => 'Original']);
        $source->likes()->attach([$viewer->id, $other->id]);
        Comment::create(['user_id' => $other->id, 'post_id' => $source->id, 'body' => 'Feedback']);
        $repost = Post::create(['user_id' => $author->id, 'type' => 'repost', 'source_post_id' => $source->id]);
        $loaded = Post::with(\App\Support\PostPresenter::relations($viewer))
            ->withCount(['comments', 'likes', 'reposts'])->findOrFail($repost->id);
        $this->assertCount(1, $loaded->sourcePost->likes);
        $this->assertSame($viewer->id, $loaded->sourcePost->likes->first()->id);
        $data = \App\Support\PostPresenter::format($loaded, $viewer);
        $this->assertSame(2, $data['sourcePost']['likes']);
        $this->assertTrue($data['sourcePost']['liked']);
        $this->assertSame(1, $data['sourcePost']['commentsCount']);
        $this->getJson('/api/posts/'.$repost->id)->assertOk()
            ->assertJsonPath('post.sourcePost.likes', 2)->assertJsonPath('post.sourcePost.liked', false);
    }

}
