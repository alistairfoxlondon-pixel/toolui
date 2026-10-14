<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\PostReaction;
use App\Models\User;
use App\Support\AvatarLibrary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvatarReactionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_library_avatar_has_local_illustrated_assets(): void
    {
        $choices = json_decode(file_get_contents(resource_path('data/character-avatars.json')), true);
        $assets = json_decode(file_get_contents(resource_path('data/avatar-assets.json')), true);
        $this->assertCount(24, $choices);
        $this->assertCount(8, array_filter($choices, fn ($choice) => $choice['group'] === 'Makers'));
        $this->assertCount(8, array_filter($choices, fn ($choice) => $choice['group'] === 'Creatures'));
        $this->assertCount(8, array_filter($choices, fn ($choice) => $choice['group'] === 'Sidekicks'));
        foreach ($choices as $choice) {
            $this->assertArrayHasKey($choice['key'], AvatarLibrary::CHOICES);
            $this->assertStringEndsWith('.svg', AvatarLibrary::url($choice['key']));
            foreach ($assets[$choice['key']] as $path) $this->assertFileExists(public_path(ltrim($path, '/')));
        }
        $this->assertStringContainsString('/avatars/orbit-ollie.svg', AvatarLibrary::url('male-indigo'));
        $this->assertStringContainsString('/avatars/nova-nomad.svg', AvatarLibrary::url('female-rose'));
    }

    public function test_members_can_react_to_every_content_type_and_change_or_remove_their_reaction(): void
    {
        $member = User::factory()->create();
        $this->actingAs($member);
        foreach (['discussion', 'question', 'poll', 'launch'] as $type) {
            $post = Post::create(['user_id' => $member->id, 'type' => $type, 'title' => 'A community post', 'body' => 'Made something useful.']);
            foreach (PostReaction::types() as $reaction) {
                $result = $this->postJson('/api/posts/'.$post->id.'/react', ['reaction' => $reaction])->assertOk()
                    ->assertJsonPath('myReaction', $reaction)->assertJsonPath('reactions.'.$reaction, 1);
                $this->assertEquals(1, array_sum($result->json('reactions')));
                $this->assertEquals(1, $post->reactions()->count());
                $this->getJson('/api/posts/'.$post->id)->assertJsonPath('post.myReaction', $reaction);
            }
            $this->postJson('/api/posts/'.$post->id.'/react', ['reaction' => 'wow'])->assertOk()
                ->assertJsonPath('myReaction', null)->assertJsonPath('reactions.wow', 0);
        }
    }

    public function test_reactions_are_member_specific_and_protected(): void
    {
        $owner = User::factory()->create();
        $post = $owner->posts()->create(['type' => 'discussion', 'body' => 'A useful update']);
        $url = '/api/posts/'.$post->id.'/react';
        $this->postJson($url, ['reaction' => 'laugh'])->assertUnauthorized();
        $this->actingAs($owner)->postJson($url, ['reaction' => 'laugh'])->assertOk();
        $this->actingAs(User::factory()->create())->postJson($url, ['reaction' => 'wow'])->assertOk()
            ->assertJsonPath('reactions.laugh', 1)->assertJsonPath('reactions.wow', 1);
        $this->postJson($url, ['reaction' => 'arbitrary'])->assertUnprocessable();
        $post->update(['is_hidden' => true]);
        $this->postJson($url, ['reaction' => 'wow'])->assertNotFound();
    }
}
