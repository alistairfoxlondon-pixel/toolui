<?php

namespace App\Http\Controllers;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class SocialAuthController extends Controller
{
    public function redirect(Request $request, string $provider): RedirectResponse
    {
        if (! in_array($provider, ['google', 'facebook'], true)) {
            abort(404);
        }

        $settings = config('services.'.$provider);
        if (empty($settings['client_id']) || empty($settings['client_secret'])) {
            return $this->failure('Social sign in is not configured yet. Use your email and password instead.');
        }

        $state = Str::random(48);
        $request->session()->put('social_auth.'.$provider.'.state', $state);
        $callback = route('social.callback', ['provider' => $provider]);
        $params = [
            'client_id' => $settings['client_id'],
            'redirect_uri' => $callback,
            'response_type' => 'code',
            'scope' => $provider === 'google' ? 'openid email profile' : 'email,public_profile',
            'state' => $state,
        ];

        if ($provider === 'google') {
            $params['include_granted_scopes'] = 'true';
            $params['prompt'] = 'select_account';
            $url = 'https://accounts.google.com/o/oauth2/v2/auth';
        } else {
            $version = trim((string) ($settings['graph_version'] ?? 'v24.0'), '/');
            $url = 'https://www.facebook.com/'.$version.'/dialog/oauth';
        }

        return redirect()->away($url.'?'.http_build_query($params, '', '&', PHP_QUERY_RFC3986));
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        if (! in_array($provider, ['google', 'facebook'], true)) {
            abort(404);
        }

        $expectedState = $request->session()->pull('social_auth.'.$provider.'.state');
        $actualState = (string) $request->query('state', '');
        if (! is_string($expectedState) || $actualState === '' || ! hash_equals($expectedState, $actualState)) {
            return $this->failure('Sign in could not be verified. Please try again.');
        }
        if ($request->filled('error') || ! $request->filled('code')) {
            return $this->failure('Sign in was cancelled or declined.');
        }

        $settings = config('services.'.$provider);
        if (empty($settings['client_id']) || empty($settings['client_secret'])) {
            return $this->failure('Social sign in is not configured yet. Use your email and password instead.');
        }

        try {
            $profile = $provider === 'google'
                ? $this->googleProfile($request, $settings)
                : $this->facebookProfile($request, $settings);

            $email = strtolower(trim((string) ($profile['email'] ?? '')));
            if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL) || empty($profile['verified'])) {
                return $this->failure('This account did not provide a verified email address. Use email sign in instead.');
            }

            $account = SocialAccount::query()
                ->where('provider', $provider)
                ->where('provider_id', (string) $profile['id'])
                ->with('user')
                ->first();

            if ($account) {
                $user = $account->user;
            } else {
                $user = User::query()->where('email', $email)->first();
                if (! $user) {
                    $user = User::create([
                        'name' => trim((string) ($profile['name'] ?? 'Vibe maker')) ?: 'Vibe maker',
                        'username' => $this->uniqueUsername((string) ($profile['name'] ?? 'member')),
                        'email' => $email,
                        'email_verified_at' => now(),
                        'password' => Str::random(64),
                        'avatar_choice' => 'fluent-robot',
                    ]);
                }
                SocialAccount::create([
                    'user_id' => $user->id,
                    'provider' => $provider,
                    'provider_id' => (string) $profile['id'],
                ]);
            }

            if (! $user || ! $user->is_active) {
                return $this->failure('This account is currently unavailable.');
            }

            Auth::login($user, true);
            $request->session()->regenerate();

            return redirect()->intended('/');
        } catch (Throwable $error) {
            report($error);

            return $this->failure('Sign in could not be completed. Please try again or use your email and password.');
        }
    }

    private function googleProfile(Request $request, array $settings): array
    {
        $tokens = Http::asForm()->timeout(15)->post('https://oauth2.googleapis.com/token', [
            'code' => $request->query('code'),
            'client_id' => $settings['client_id'],
            'client_secret' => $settings['client_secret'],
            'redirect_uri' => route('social.callback', ['provider' => 'google']),
            'grant_type' => 'authorization_code',
        ])->throw()->json();

        $profile = Http::withToken((string) ($tokens['access_token'] ?? ''))
            ->timeout(15)
            ->get('https://www.googleapis.com/oauth2/v2/userinfo')
            ->throw()
            ->json();

        return [
            'id' => (string) ($profile['id'] ?? ''),
            'name' => (string) ($profile['name'] ?? ''),
            'email' => (string) ($profile['email'] ?? ''),
            'verified' => filter_var($profile['verified_email'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ];
    }

    private function facebookProfile(Request $request, array $settings): array
    {
        $version = trim((string) ($settings['graph_version'] ?? 'v24.0'), '/');
        $token = Http::timeout(15)->get('https://graph.facebook.com/'.$version.'/oauth/access_token', [
            'client_id' => $settings['client_id'],
            'client_secret' => $settings['client_secret'],
            'redirect_uri' => route('social.callback', ['provider' => 'facebook']),
            'code' => $request->query('code'),
        ])->throw()->json();

        $profile = Http::withToken((string) ($token['access_token'] ?? ''))
            ->timeout(15)
            ->get('https://graph.facebook.com/'.$version.'/me', ['fields' => 'id,name,email'])
            ->throw()
            ->json();

        return [
            'id' => (string) ($profile['id'] ?? ''),
            'name' => (string) ($profile['name'] ?? ''),
            'email' => (string) ($profile['email'] ?? ''),
            'verified' => ! empty($profile['email']),
        ];
    }

    private function uniqueUsername(string $name): string
    {
        $base = Str::lower(preg_replace('/[^A-Za-z0-9_]/', '', str_replace(' ', '_', $name)) ?: 'member');
        if (strlen($base) < 3) $base = 'member';
        $base = substr($base, 0, 18);
        $username = $base;
        $suffix = 1;

        while (User::query()->where('username', $username)->exists()) {
            $username = substr($base, 0, 18).$suffix;
            $suffix++;
        }

        return $username;
    }

    private function failure(string $message): RedirectResponse
    {
        return redirect()->route('login')->with('auth_error', $message);
    }
}
