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
    public function members_cannot_share_ai_models_as_posts(): void
    {
        $this->actingAs($this->member)->postJson('/api/posts', [
            'type' => 'model', 'title' => 'A model', 'body' => 'Not member-managed.',
        ])->assertUnprocessable()->assertJsonValidationErrors('type');
        $this->assertDatabaseMissing('posts', ['type' => 'model']);
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
    public function legacy_model_posts_are_preserved_but_excluded_from_the_feed(): void
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
        $response->assertJsonCount(0, 'data');
        $this->assertDatabaseHas('posts', ['type' => 'model']);
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
