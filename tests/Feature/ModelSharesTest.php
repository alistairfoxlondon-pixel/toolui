<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ModelSharesTest extends TestCase
{
    use RefreshDatabase;

    private User $member;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->member = User::create([
            'name' => 'Model Tester',
            'username' => 'modeltester',
            'email' => 'modeltester@vibedock.test',
            'password' => Hash::make('Password123!'),
            'avatar_choice' => 'female-teal',
            'is_active' => true,
        ]);

        $this->admin = User::create([
            'name' => 'Cover Admin',
            'username' => 'coveradmin',
            'email' => 'coveradmin@vibedock.test',
            'password' => Hash::make('Password123!'),
            'avatar_choice' => 'male-slate',
            'is_active' => true,
            'is_admin' => true,
        ]);
    }

    #[Test]
    public function members_can_share_an_ai_model_with_access_metadata(): void
    {
        $response = $this->actingAs($this->member)->postJson('/api/posts', [
            'type' => 'model',
            'title' => 'Vibe 2.5 Flash',
            'body' => 'A fast model with a generous free tier.',
            'model_provider' => 'Google',
            'model_access' => 'freemium',
            'project_url' => 'https://example.com/model',
        ]);

        $response->assertCreated()->assertJsonPath('post.modelAccess', 'freemium');

        $this->assertDatabaseHas('posts', [
            'type' => 'model',
            'model_provider' => 'Google',
            'model_access' => 'freemium',
        ]);
    }

    #[Test]
    public function model_posts_reject_unknown_access_values(): void
    {
        $this->actingAs($this->member)
            ->postJson('/api/posts', [
                'type' => 'model',
                'title' => 'Broken share',
                'body' => 'Invalid access tier.',
                'model_access' => 'enterprise',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('model_access');
    }

    #[Test]
    public function non_model_posts_reject_model_metadata(): void
    {
        $this->actingAs($this->member)
            ->postJson('/api/posts', [
                'type' => 'discussion',
                'body' => 'Just talking.',
                'model_provider' => 'OpenAI',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('model_provider');
    }

    #[Test]
    public function the_feed_filters_model_posts(): void
    {
        Post::create([
            'user_id' => $this->member->id,
            'type' => 'model',
            'title' => 'Vibe 2.5 Flash',
            'body' => 'A fast model.',
            'model_access' => 'free',
        ]);

        $response = $this->actingAs($this->member)->getJson('/api/feed?type=model');

        $response->assertOk();
        $this->assertSame('model', $response->json('posts.0.type'));
        $this->assertSame('free', $response->json('posts.0.modelAccess'));
    }

    #[Test]
    public function members_choose_a_predefined_profile_cover(): void
    {
        $response = $this->actingAs($this->member)->putJson('/api/profile', [
            'name' => 'Model Tester',
            'username' => 'modeltester',
            'cover_choice' => 'sunset',
        ]);

        $response->assertOk()->assertJsonPath('user.coverChoice', 'sunset');

        $this->actingAs($this->member)->putJson('/api/profile', [
            'name' => 'Model Tester',
            'username' => 'modeltester',
            'cover_choice' => 'lava-lamp',
        ])->assertStatus(422)->assertJsonValidationErrors('cover_choice');
    }

    #[Test]
    public function profile_summaries_include_the_cover_choice(): void
    {
        $this->member->forceFill(['cover_choice' => 'grape'])->save();

        $response = $this->actingAs($this->member)->getJson('/api/users/modeltester');

        $response->assertOk()->assertJsonPath('user.coverChoice', 'grape');
    }

    #[Test]
    public function administrators_feature_posts_and_remove_comments(): void
    {
        $post = Post::create([
            'user_id' => $this->member->id,
            'type' => 'discussion',
            'body' => 'A post worth picking.',
        ]);
        $post->comments()->create([
            'user_id' => $this->admin->id,
            'body' => 'A comment to remove.',
        ]);

        $this->actingAs($this->admin)
            ->patchJson("/admin/posts/{$post->id}/featured", ['is_featured' => true])
            ->assertRedirect();

        $this->actingAs($this->admin)
            ->deleteJson("/admin/comments/{$post->comments()->first()->id}")
            ->assertRedirect();

        $this->assertTrue((bool) $post->fresh()->is_featured);
        $this->assertSame(0, $post->fresh()->comments()->count());

        $this->actingAs($this->member)
            ->patchJson("/admin/posts/{$post->id}/featured", ['is_featured' => false])
            ->assertForbidden();
    }

    #[Test]
    public function hidden_posts_return_not_found_on_their_public_page(): void
    {
        $post = Post::create([
            'user_id' => $this->member->id,
            'type' => 'discussion',
            'body' => 'A hidden thought.',
            'is_hidden' => true,
        ]);

        $this->get("/posts/{$post->id}")->assertNotFound();

        $post->forceFill(['is_hidden' => false])->save();
        $this->get("/posts/{$post->id}")->assertOk();
    }

    #[Test]
    public function the_sitemap_lists_public_pages(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
        $this->assertStringContainsString('<loc>'.url('/models').'</loc>', $response->getContent());
        $this->assertStringNotContainsString('<loc>'.url('/admin').'</loc>', $response->getContent());
    }
}
