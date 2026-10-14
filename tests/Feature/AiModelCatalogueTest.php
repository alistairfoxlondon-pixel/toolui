<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiModelCatalogueTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalogue_is_retired_in_favor_of_community_polls(): void
    {
        $this->withoutVite();
        $this->get('/models')->assertStatus(301)->assertRedirect('/polls');
        $this->get('/polls')->assertOk();
        $this->getJson('/api/models')->assertNotFound();
        $this->postJson('/admin/models', [])->assertNotFound();
        $this->putJson('/api/models/1/rating', ['score' => 5])->assertNotFound();
    }
}
