<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Post;
use App\Models\User;
use App\Support\BadgeLibrary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BadgesAndBrandsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_creation_and_information_pages_have_independent_routes(): void
    {
        foreach (['create/post', 'create/question', 'create/poll', 'create/launch', 'badges', 'help'] as $path) {
            $this->get('/'.$path)->assertOk();
        }
        $this->get('/polls')->assertStatus(301)->assertRedirect('/feed?filter=poll');
        $this->get('/create/model')->assertNotFound();
    }

    private function launch(array $extra = []): array
    {
        return array_merge(['type' => 'launch', 'title' => 'Test project', 'body' => 'A useful project for makers.', 'project_url' => 'https://example.com'], $extra);
    }

    public function test_claims_are_unique_pending_and_cannot_self_verify(): void
    {
        $user = User::factory()->create();
        $payload = $this->launch(['brand_slug' => 'my-brand', 'brand_authorized' => true, 'status' => 'verified', 'reviewed_by' => $user->id]);
        $response = $this->actingAs($user)->postJson('/api/posts', $payload)->assertCreated()
            ->assertJsonPath('post.brand.status', 'pending')->assertJsonPath('post.brand.slug', 'my-brand');
        $this->assertDatabaseHas('brands', ['slug' => 'my-brand', 'status' => 'pending', 'user_id' => $user->id, 'reviewed_by' => null]);
        $this->actingAs(User::factory()->create())->postJson('/api/posts', $payload)->assertUnprocessable()->assertJsonValidationErrors('brand_slug');
        $this->assertDatabaseCount('brands', 1);
        $this->assertDatabaseCount('posts', 1);
        $this->get('/brands/my-brand')->assertOk();
        Post::findOrFail($response->json('post.id'))->update(['is_hidden' => true]);
        $this->get('/brands/my-brand')->assertNotFound();
    }

    public function test_claims_require_authorization_and_are_optional(): void
    {
        $this->actingAs(User::factory()->create());
        $this->postJson('/api/posts', $this->launch(['brand_slug' => 'my-brand']))->assertUnprocessable()->assertJsonValidationErrors('brand_authorized');
        $this->postJson('/api/posts', $this->launch(['brand_slug' => 'Invalid Handle', 'brand_authorized' => true]))->assertUnprocessable();
        $this->postJson('/api/posts', ['type' => 'discussion', 'body' => 'A good day to build', 'brand_slug' => 'my-brand', 'brand_authorized' => true])->assertUnprocessable();
        $this->postJson('/api/posts', $this->launch())->assertCreated()->assertJsonPath('post.brand', null);
        $this->postJson('/api/posts', ['type' => 'discussion', 'body' => 'A good day to build'])->assertCreated();
        $this->assertDatabaseCount('brands', 0);
    }

    public function test_only_active_admins_can_grant_and_revoke_verification(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner)->postJson('/api/posts', $this->launch(['brand_slug' => 'my-brand', 'brand_authorized' => true]))->assertCreated();
        $brand = Brand::firstOrFail();
        $this->patchJson('/admin/brands/'.$brand->id, ['status' => 'verified'])->assertForbidden();
        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)->patch('/admin/brands/'.$brand->id, ['status' => 'verified'])->assertRedirect();
        $this->getJson('/api/posts/'.$brand->post_id)->assertJsonPath('post.brand.status', 'verified');
        $this->assertDatabaseHas('brands', ['id' => $brand->id, 'reviewed_by' => $admin->id]);
        $this->patch('/admin/brands/'.$brand->id, ['status' => 'rejected'])->assertRedirect();
        $this->getJson('/api/posts/'.$brand->post_id)->assertJsonPath('post.brand.status', 'rejected');
        $admin->forceFill(['is_active' => false])->save();
        $this->patchJson('/admin/brands/'.$brand->id, ['status' => 'verified'])->assertForbidden();
    }

    public function test_activity_badges_exclude_hidden_posts_and_reposts(): void
    {
        $user = User::factory()->create();
        $this->assertSame([], BadgeLibrary::forUser($user));
        $launch = $user->posts()->create($this->launch());
        $keys = array_column(BadgeLibrary::forUser($user), 'key');
        $this->assertContains('first-step', $keys);
        $this->assertContains('maker', $keys);
        $launch->update(['is_hidden' => true]);
        $user->posts()->create(['type' => 'repost', 'source_post_id' => $launch->id]);
        $this->assertSame([], BadgeLibrary::forUser($user));
    }

    public function test_admin_badges_can_be_awarded_once_and_revoked(): void
    {
        $member = User::factory()->create();
        $url = '/admin/users/'.$member->id.'/badge';
        $payload = ['badge' => 'expert', 'action' => 'award'];
        $this->actingAs($member)->patchJson($url, $payload)->assertForbidden();
        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)->patch($url, $payload)->assertRedirect();
        $this->patch($url, $payload)->assertRedirect();
        $this->assertDatabaseCount('member_badges', 1);
        $this->assertDatabaseHas('member_badges', ['user_id' => $member->id, 'badge' => 'expert', 'awarded_by' => $admin->id]);
        $this->getJson('/api/users/'.$member->username)->assertJsonPath('user.badges.0.label', 'Expert');
        $this->patchJson($url, ['badge' => 'maker', 'action' => 'award'])->assertUnprocessable();
        $this->patch($url, ['badge' => 'expert', 'action' => 'revoke'])->assertRedirect();
        $this->assertDatabaseCount('member_badges', 0);
    }
}
