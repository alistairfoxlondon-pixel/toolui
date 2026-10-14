<?php

namespace App\Http\Controllers;

use App\Models\AiModel;
use App\Models\AiModelRating;
use Illuminate\Http\{JsonResponse, RedirectResponse, Request};
use Illuminate\Validation\Rule;

class AiModelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $own = $request->user() ? AiModelRating::where('user_id', $request->user()->id)->pluck('score', 'ai_model_id') : collect();
        $models = AiModel::where('is_active', true)->withCount('ratings')->withAvg('ratings', 'score')
            ->orderByDesc('ratings_avg_score')->orderByDesc('ratings_count')->orderBy('name')->get();
        return response()->json(['data' => $models->map(fn ($model) => $this->present($model, $own[$model->id] ?? null))]);
    }

    public function rate(Request $request, AiModel $model): JsonResponse
    {
        abort_unless($model->is_active, 404);
        $data = $request->validate(['score' => ['required', 'integer', 'between:1,5']]);
        AiModelRating::upsert([
            ['ai_model_id' => $model->id, 'user_id' => $request->user()->id, 'score' => $data['score'], 'created_at' => now(), 'updated_at' => now()],
        ], ['ai_model_id', 'user_id'], ['score', 'updated_at']);
        $model->loadCount('ratings')->loadAvg('ratings', 'score');
        return response()->json(['model' => $this->present($model, (int) $data['score'])]);
    }

    public function store(Request $request): RedirectResponse
    {
        AiModel::create($this->validated($request));
        return back()->with('status', 'Model added to the rating catalogue.');
    }

    public function update(Request $request, AiModel $model): RedirectResponse
    {
        $model->update($this->validated($request, $model));
        return back()->with('status', 'Model updated. Ratings have been preserved.');
    }

    private function validated(Request $request, ?AiModel $model = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('ai_models')->ignore($model?->id)],
            'provider' => ['required', 'string', 'max:80'],
            'description' => ['required', 'string', 'max:500'],
            'website_url' => ['nullable', 'url:http,https', 'max:2048'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function present(AiModel $model, ?int $own): array
    {
        return ['id' => $model->id, 'name' => $model->name, 'provider' => $model->provider,
            'description' => $model->description, 'websiteUrl' => $model->website_url,
            'ratingCount' => (int) $model->ratings_count,
            'averageRating' => $model->ratings_count ? round((float) $model->ratings_avg_score, 2) : null,
            'myRating' => $own];
    }
}
