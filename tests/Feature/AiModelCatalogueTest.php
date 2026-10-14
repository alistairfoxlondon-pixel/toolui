<?php

namespace Tests\Feature;

use App\Models\AiModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AiModelCatalogueTest extends TestCase
{
    use RefreshDatabase;

    private function member(bool $admin = false): User
    {
        return User::factory()->create(['is_active' => true, 'is_admin' => $admin]);
    }

    private function model(): AiModel
    {
        return AiModel::create(['name' => 'Test model', 'provider' => 'Test provider', 'description' => 'For coding.', 'is_active' => true]);
    }

    #[Test]
    public function catalogue_is_public_and_unrated_models_have_no_fabricated_score(): void
    {
        $this->model();
        $this->getJson('/api/models')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.ratingCount', 0)->assertJsonPath('data.0.averageRating', null);
    }

    #[Test]
    public function only_admins_can_manage_models(): void
    {
        $payload = ['name' => 'Coding model', 'provider' => 'Provider', 'description' => 'Useful for coding.', 'is_active' => true];
        $this->actingAs($this->member())->postJson('/admin/models', $payload)->assertForbidden();
        $this->actingAs($this->member(true))->post('/admin/models', $payload)->assertRedirect();
        $this->assertDatabaseHas('ai_models', ['name' => 'Coding model']);
    }

    #[Test]
    public function ratings_require_authentication_and_valid_scores_and_are_editable(): void
    {
        $model = $this->model();
        $url = "/api/models/{$model->id}/rating";
        $this->putJson($url, ['score' => 5])->assertUnauthorized();
        $this->actingAs($this->member())->putJson($url, ['score' => 6])->assertUnprocessable();
        $this->putJson($url, ['score' => 5])->assertOk()->assertJsonPath('model.ratingCount', 1);
        $this->putJson($url, ['score' => 3])->assertOk()->assertJsonPath('model.myRating', 3)->assertJsonPath('model.ratingCount', 1);
        $this->assertDatabaseCount('ai_model_ratings', 1);
        $this->getJson('/api/models')->assertJsonPath('data.0.myRating', 3);
        $this->actingAs($this->member())->putJson($url, ['score' => 5])->assertOk()->assertJsonPath('model.ratingCount', 2);
        $this->assertEquals(4, $this->getJson('/api/models')->json('data.0.averageRating'));
    }

    #[Test]
    public function archiving_preserves_ratings_and_prevents_further_rating(): void
    {
        $model = $this->model();
        $this->actingAs($this->member())->putJson("/api/models/{$model->id}/rating", ['score' => 4])->assertOk();
        $this->actingAs($this->member(true))->put("/admin/models/{$model->id}", [
            'name' => $model->name, 'provider' => $model->provider, 'description' => $model->description, 'is_active' => false,
        ])->assertRedirect();
        $this->getJson('/api/models')->assertJsonCount(0, 'data');
        $this->putJson("/api/models/{$model->id}/rating", ['score' => 5])->assertNotFound();
        $this->assertDatabaseCount('ai_model_ratings', 1);
    }

    #[Test]
    public function launches_preserve_seo_descriptions_and_rank_websites_and_apps(): void
    {
        $member = $this->member();
        foreach (['website', 'app'] as $category) {
            $this->actingAs($member)->postJson('/api/posts', [
                'type' => 'launch', 'title' => 'A '.$category, 'body' => 'A useful project.',
                'launch_category' => $category, 'project_url' => 'https://example.com', 'seo_description' => 'Short project preview.',
            ])->assertCreated()->assertJsonPath('post.seoDescription', 'Short project preview.');
        }
        $this->getJson('/api/rankings')->assertOk()->assertJsonCount(2, 'tools');
        $this->get('/feed')->assertOk();
        $this->get('/settings/profile')->assertOk();
    }
}
