<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_homepage_renders_the_community_app_shell(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('id="app"', false)
            ->assertSee('VibeDock');
    }

    public function test_a_member_can_register_and_receive_a_session(): void
    {
        $this->postJson('/register', [
            'name' => 'Taylor Maker',
            'username' => 'taylormaker',
            'email' => 'taylor@example.test',
            'password' => 'long-enough-password',
        ])->assertCreated()
            ->assertJsonPath('user.name', 'Taylor Maker');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'taylor@example.test']);
    }

    public function test_a_member_can_publish_and_vote_on_a_poll(): void
    {
        $author = User::factory()->create();
        $voter = User::factory()->create();

        $response = $this->actingAs($author)->postJson('/api/posts', [
            'type' => 'poll',
            'title' => 'What should I make this weekend?',
            'body' => 'Help me pick a tiny project.',
            'options' => ['A reading list', 'A habit tracker'],
        ])->assertCreated();

        $postId = $response->json('post.id');

        $this->actingAs($voter)->postJson("/api/posts/{$postId}/vote", [
            'option_index' => 1,
        ])->assertOk()
            ->assertJsonPath('votes.0', 0)
            ->assertJsonPath('votes.1', 1)
            ->assertJsonPath('votedOption', 1);

        $this->assertDatabaseHas('post_votes', [
            'post_id' => $postId,
            'user_id' => $voter->id,
            'option_index' => 1,
        ]);
    }

    public function test_a_launch_requires_a_public_project_url(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/posts', [
            'type' => 'launch',
            'title' => 'My new tiny tool',
            'body' => 'A little thing I made this week.',
        ])->assertStatus(422)
            ->assertJsonValidationErrors('project_url');
    }
}
