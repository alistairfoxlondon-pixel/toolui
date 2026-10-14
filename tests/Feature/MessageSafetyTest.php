<?php

namespace Tests\Feature;

use App\Models\{CommunityChatMessage, DirectMessage, MessageReport, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageSafetyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void { parent::setUp(); $this->withoutVite(); }

    public function test_non_friends_can_message_and_only_the_pair_can_read_the_thread(): void
    {
        [$alice, $bob, $stranger] = User::factory()->count(3)->create()->all();
        $this->actingAs($alice)->postJson('/api/messages/'.$bob->id, ['body' => 'Hello, fellow maker.'])->assertCreated();
        $this->actingAs($bob)->getJson('/api/messages/'.$alice->id)->assertOk()->assertJsonPath('data.0.body', 'Hello, fellow maker.');
        $this->actingAs($stranger)->getJson('/api/messages/'.$alice->id)->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($bob)->getJson('/api/messages')->assertOk()->assertJsonPath('data.0.user.id', $alice->id);
    }

    public function test_blocking_stops_both_directions_and_hides_community_messages(): void
    {
        [$alice, $bob] = User::factory()->count(2)->create()->all();
        CommunityChatMessage::create(['user_id' => $bob->id, 'body' => 'Hello community']);
        $this->actingAs($alice)->postJson('/api/users/'.$bob->id.'/block')->assertOk();
        $this->actingAs($alice)->postJson('/api/messages/'.$bob->id, ['body' => 'Hello'])->assertForbidden();
        $this->actingAs($bob)->postJson('/api/messages/'.$alice->id, ['body' => 'Hello'])->assertForbidden();
        $this->actingAs($alice)->getJson('/api/community-chat')->assertJsonCount(0, 'data');
        $this->actingAs($bob)->deleteJson('/api/users/'.$alice->id.'/block')->assertOk();
        $this->actingAs($bob)->postJson('/api/messages/'.$alice->id, ['body' => 'Still blocked'])->assertForbidden();
        $this->actingAs($alice)->deleteJson('/api/users/'.$bob->id.'/block')->assertOk();
        $this->actingAs($bob)->postJson('/api/messages/'.$alice->id, ['body' => 'Hello again'])->assertCreated();
    }

    public function test_explicit_threats_are_rejected_before_storage_in_both_chats(): void
    {
        [$alice, $bob] = User::factory()->count(2)->create()->all();
        $this->actingAs($alice)->postJson('/api/messages/'.$bob->id, ['body' => 'I WILL KILL YOU'])->assertUnprocessable()->assertJsonValidationErrors('body');
        $this->actingAs($alice)->postJson('/api/community-chat', ['body' => 'kill yourself'])->assertUnprocessable();
        $this->assertDatabaseCount('direct_messages', 0);
        $this->assertDatabaseCount('community_chat_messages', 0);
        $this->postJson('/api/community-chat', ['body' => 'Kill the process, then restart the app.'])->assertCreated();
    }

    public function test_only_a_recipient_can_report_a_private_message_and_duplicates_are_idempotent(): void
    {
        [$alice, $bob, $stranger] = User::factory()->count(3)->create()->all();
        $message = DirectMessage::create(['sender_id' => $alice->id, 'recipient_id' => $bob->id, 'body' => 'Reportable context.']);
        $url = '/api/message-reports/direct/'.$message->id;
        $this->actingAs($stranger)->postJson($url, ['reason' => 'harassment'])->assertNotFound();
        $this->actingAs($alice)->postJson($url, ['reason' => 'spam'])->assertNotFound();
        $this->actingAs($bob)->postJson($url, ['reason' => 'harassment'])->assertCreated()->assertJsonMissing(['reported_body' => 'Reportable context.']);
        $this->postJson($url, ['reason' => 'spam'])->assertCreated();
        $this->assertDatabaseCount('message_reports', 1);
        $this->assertDatabaseHas('message_reports', ['reporter_id' => $bob->id, 'reported_body' => 'Reportable context.']);
    }

    public function test_members_can_report_community_messages_but_not_their_own(): void
    {
        [$alice, $bob] = User::factory()->count(2)->create()->all();
        $message = CommunityChatMessage::create(['user_id' => $alice->id, 'body' => 'A message to review.']);
        $url = '/api/message-reports/community/'.$message->id;
        $this->actingAs($alice)->postJson($url, ['reason' => 'hate'])->assertUnprocessable();
        $this->actingAs($bob)->postJson($url, ['reason' => 'invalid'])->assertUnprocessable();
        $this->postJson($url, ['reason' => 'hate', 'details' => 'Please review context.'])->assertCreated();
    }

    public function test_only_admins_can_review_and_hidden_messages_disappear_from_threads(): void
    {
        [$alice, $bob, $admin] = User::factory()->count(3)->create()->all();
        $admin->forceFill(['is_admin' => true])->save();
        $message = DirectMessage::create(['sender_id' => $alice->id, 'recipient_id' => $bob->id, 'body' => 'Reported message']);
        $this->actingAs($bob)->postJson('/api/message-reports/direct/'.$message->id, ['reason' => 'spam'])->assertCreated();
        $report = MessageReport::firstOrFail();
        $url = '/admin/message-reports/'.$report->id.'/review';
        $this->actingAs($bob)->post($url, ['action' => 'hide'])->assertForbidden();
        $this->actingAs($admin)->post($url, ['action' => 'hide'])->assertRedirect();
        $this->assertDatabaseHas('direct_messages', ['id' => $message->id, 'is_hidden' => true]);
        $this->assertDatabaseHas('message_reports', ['id' => $report->id, 'status' => 'resolved', 'reviewed_by' => $admin->id]);
        $this->actingAs($bob)->getJson('/api/messages/'.$alice->id)->assertJsonCount(0, 'data');
        $this->getJson('/api/messages')->assertJsonCount(0, 'data');
    }

    public function test_threads_return_the_latest_hundred_messages_in_chronological_order(): void
    {
        [$alice, $bob] = User::factory()->count(2)->create()->all();
        for ($i = 1; $i <= 105; $i++) DirectMessage::create(['sender_id' => $alice->id, 'recipient_id' => $bob->id, 'body' => 'Message '.$i]);
        $this->actingAs($bob)->getJson('/api/messages/'.$alice->id)->assertJsonCount(100, 'data')->assertJsonPath('data.0.body', 'Message 6')->assertJsonPath('data.99.body', 'Message 105');
    }

    public function test_self_and_inactive_recipient_and_unauthenticated_messages_are_rejected(): void
    {
        [$alice, $bob] = User::factory()->count(2)->create()->all();
        $this->postJson('/api/messages/'.$alice->id, ['body' => 'Hello'])->assertUnauthorized();
        $this->actingAs($alice)->postJson('/api/messages/'.$alice->id, ['body' => 'Hello'])->assertNotFound();
        $bob->forceFill(['is_active' => false])->save();
        $this->postJson('/api/messages/'.$bob->id, ['body' => 'Hello'])->assertNotFound();
        $this->postJson('/api/users/'.$alice->id.'/block')->assertUnprocessable();
    }
    public function test_message_send_rate_is_separate_from_read_requests(): void
    {
        [$alice, $bob] = User::factory()->count(2)->create()->all();
        $this->actingAs($alice);
        for ($i = 0; $i < 12; $i++) $this->getJson('/api/community-chat')->assertOk();
        for ($i = 0; $i < 10; $i++) $this->postJson('/api/messages/'.$bob->id, ['body' => 'Message '.$i])->assertCreated();
        $this->postJson('/api/community-chat', ['body' => 'Beyond the combined send allowance'])->assertStatus(429);
    }

    public function test_report_endpoint_is_rate_limited(): void
    {
        [$alice, $bob] = User::factory()->count(2)->create()->all();
        $this->actingAs($bob);
        for ($i = 0; $i < 6; $i++) {
            $message = CommunityChatMessage::create(['user_id' => $alice->id, 'body' => 'Review '.$i]);
            $response = $this->postJson('/api/message-reports/community/'.$message->id, ['reason' => 'spam']);
            $i < 5 ? $response->assertCreated() : $response->assertStatus(429);
        }
    }

}
