# VibeDock

VibeDock is a Laravel community for people who make AI tools, apps, and creative projects. Members can publish discussions, questions, polls, launches, and AI model shares (with free, freemium, or paid access tags); upload post images and project logos; vote on launches; build professional profiles with library avatars and predefined cover designs; follow and friend other makers; send private messages; and join a shared community chat. Administrators can review reports, feature or hide posts, manage accounts, posts, and comments, and remove group chat messages.

The information architecture and content are original. The linked repository informed visual qualities only. The interface uses a mobile first layout, solid color surfaces, accessible controls, Material Symbols icons, and responsive navigation.

## Stack

- Laravel 12 and PHP 8.2 or newer
- MySQL or compatible MariaDB
- Vite for production CSS and JavaScript assets
- File sessions, file cache, and synchronous jobs for shared hosting
- PHP mbstring, GD, and DOM extensions for image resizing and safe SVG logo handling

The standalone preview is for UI review. It stores preview posts, profiles, and chat messages in browser storage. It is not a replacement for the Laravel backend.

## Preview and production assets

```bash
npm install
npm run preview
```

Compile Laravel assets for deployment with:

```bash
npm run build
```

The standalone preview accepts these local sample accounts:

| Account | Email | Password |
| --- | --- | --- |
| Maker | `demo@vibedock.test` | `VibeDockDemo2026!` |
| Administrator | `admin@vibedock.test` | `VibeDockAdmin2026!` |

These preview credentials only sign into the browser demo. The Laravel database accounts are created separately below. Never deploy these sample passwords.

## Local installation

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Set `APP_ENV=local`, `APP_URL`, and the MySQL `DB_*` values in `.env`, then run:

```bash
php artisan migrate
php artisan storage:link
npm install
npm run build
php artisan serve
```

Create local database accounts and sample community content with:

```bash
php artisan vibedock:seed-demo
```

The command creates these Laravel credentials:

| Account | Email | Password |
| --- | --- | --- |
| Maker | `demo@vibedock.test` | `VibeDockDemo2026!` |
| Administrator | `admin@vibedock.test` | `VibeDockAdmin2026!` |

The command and seeder refuse to run in production. Do not reuse these passwords on a public site. For hot reload, run `php artisan serve` and `npm run dev` in separate terminals.

## Social sign in

Email and password sign in works without provider credentials. To enable Google and Facebook, create OAuth applications with the callback URLs for your domain:

- `https://your-domain.example/auth/google/callback`
- `https://your-domain.example/auth/facebook/callback`

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, and `FACEBOOK_CLIENT_SECRET` in the private `.env` file. Set `FACEBOOK_GRAPH_VERSION` to a currently supported Graph API version. Never add provider secrets to frontend code or commit them to source control. Social accounts require a provider supplied email address.

## Hostinger shared hosting

1. Create a MySQL database and database user in hPanel.
2. Keep application code outside the public web directory where possible. Set the domain document root to Laravel's `public` directory. If the plan requires `public_html`, place the application elsewhere, copy the contents of `public` into `public_html`, and update the application paths in `public_html/index.php`. Never expose `.env`, `vendor`, or the application source through a public URL.
3. Set production values in `.env`: `APP_ENV=production`, `APP_DEBUG=false`, the correct `APP_URL`, a fresh `APP_KEY`, and private database credentials.
4. Install PHP dependencies with `composer install --no-dev --optimize-autoloader`, run `php artisan migrate --force`, and build with `npm install && npm run build`. If Node is not available on the hosting plan, build locally and upload `public/build`.
5. Ensure PHP can write to `storage` and `bootstrap/cache`. Confirm that GD and DOM are enabled, and set upload limits high enough for a 5 MB image plus the multipart request overhead. Run `php artisan storage:link` so optimized profile photos, post images, and logos can be served from the public disk. If the application lives outside `public_html`, confirm that `public_html/storage` points to `storage/app/public`.
6. Register your own account, then grant it administrator access from the server terminal:

   ```bash
   php artisan vibedock:make-admin you@example.com
   ```

   This promotes an existing account. No production administrator account or password is seeded by default. The demo seeder is blocked in production.

The site does not require a Node server, Redis, or queue workers at runtime. Confirm PHP extensions, database limits, upload limits, and document root behaviour against the Hostinger Business plan in use.

## Community pages

- `/` is the visual landing page; `/feed` is the separate community feed.
- `/models` is the admin-curated AI catalogue with editable member ratings.
- `/settings/profile` is the full-page profile editor.
- `/launches` is the project showcase with launch votes.
- `/rankings` lists launches across all categories, including websites and apps, by net votes, plus a rolling engagement leaderboard.
- `/community-chat` is the shared member chat. It refreshes every 12 seconds without a websocket server.
- `/u/{username}` is a public professional profile.
- `/messages` is private member chat. Active members can message other active members; friendship is no longer required. Blocking stops sends in both directions.
- `/about`, `/guidelines`, `/privacy`, and `/terms` are accessible information pages.
- `/admin` is restricted to administrators.

Migrations create the community profiles, posts, comments, polls, likes, reactions, launch votes, reports, follows, friend requests, direct messages, group chat, and social account links. SVG launch logos are sanitized before storage. Profile photos and raster logos are resized when GD is available. Reports, account controls, and chat moderation are managed from the admin area.

## Messaging, reporting, and moderation

Run `php artisan migrate` before using the new messaging features on Laravel. Migration `2026_10_14_000013_add_message_safety.php` adds account blocks, message reports, and hidden-message flags. The standalone UI preview simulates these features locally; it does not send messages to other browsers or notify real moderators.

- Private messages are accessible from the main navigation, mobile Inbox, public profiles, and the searchable **New message** picker. Only the two participants can read a private thread through the API. The latest 100 messages are displayed; older messages are retained in the database (history pagination is not implemented).
- Community chat uses the full available width and a viewport-height transcript with a fixed composer. The latest 80 messages refresh every 12 seconds. Open private threads and the inbox also poll while visible. Polling snapshots reflect messages hidden by moderators.
- **Block member** prevents private sends in both directions and excludes blocked relationships from community chat API results. The **Blocked members** control supports unblocking. Existing private history remains accessible so recipients can report it. This is a messaging block, not a site-wide ban.
- Every received message has an accessible options menu with **Report message** and **Block member**. Reports support hate speech, harassment, threats, spam, and other reasons, with optional details. A report may also block the sender. Repeated reports by the same member are idempotent.
- Only a recipient can report a private message. The admin queue receives a snapshot of that one reported message—not the rest of the conversation. Admins can hide the message or dismiss the report. Reports alone do not ban members or auto-hide messages, avoiding malicious-report abuse. Private messages are stored server-side and are **not end-to-end encrypted**.
- Named server-side rate limits allow 10 message sends and 5 reports per minute per member. They are separate from the general API limit, so reading/polling does not consume the send allowance.

### Automatic-filter limits

`resources/data/moderation-rules.json` is shared by the preview and Laravel checks. PHP enforces it before saving direct messages, community messages, posts, poll text, comments, and repost text, so disabling JavaScript does not bypass the rules. It normalizes case, common leetspeak, zero-width characters, and common full-width text, and rejects selected explicit slurs, threats, and directed insults. A failed message stays in the composer for editing.

**This is a small rule-based baseline, not comprehensive hate-speech detection.** It can miss coded abuse, context, languages, and novel evasions, and may reject quotations or benign uses. The included Bengali/Hindi phrases are examples, not full language coverage. Before a public launch, review and extend the rules with language specialists, define an appeal/contact process, and consider a properly evaluated moderation service. Reports and human review remain essential. The implementation rejects matching content; it does not automatically suspend an account.

Report snapshots contain personal data. The operator must define retention, access, deletion, and audit policies before production; no automatic evidence-retention purge is configured.

### Skills and validation

Profile editing includes 60 searchable skill suggestions, each with an original inline vector icon. Members may select up to 12 skills or enter custom skills (32 characters each). Server validation retains the same limits.

`npm test` covers sign-in, direct-message persistence, community sending, automatic rejection, report/block/unblock flows, and illustrated skill selection. `tests/Feature/MessageSafetyTest.php` covers Laravel participant isolation, report authorization, bidirectional blocking, moderation, admin review, and latest-message ordering. Run `php artisan test` in a PHP/Laravel environment. This sandbox has no PHP runtime: PHP source was syntax-parsed, but the Laravel feature suite and migrations have **not** been executed here.

## Typography and artwork

The primary font stack is `Telenor Evolution`, `Telenor`, then the self-hosted, OFL-licensed Figtree variable font. **The exact Grameenphone/Telenor font is not bundled**: a licensed file was not supplied and redistribution rights could not be verified. Browsers without Telenor installed render Figtree, not an imitation renamed as Telenor.

To activate an appropriately licensed webfont for every visitor, add the WOFF2 files to `resources/fonts/` and define their actual weights/styles with `@font-face` in `resources/css/fonts.css`, using the family name `Telenor Evolution` and `font-display: swap`. Vite will fingerprint the files. Do not hotlink third-party font files or claim the fallback is Telenor.

The green-and-ink homepage uses an original AI-generated human illustration exported as background-free, responsive WebP assets (880px and 440px). The five small SVG illustrations and two-tone UI icons are original project assets reused across discovery, launches, models, rankings, and information pages. They are not copies of the supplied commercial reference packs; the reference image URLs could not be fetched in this environment.

The homepage keeps its hero under 30 words, using image-led navigation rather than repeated explanatory copy. About and Guidelines retain the fuller context. On phones, search expands on demand, a native feed filter exposes every category, and labeled composer controls remain visible. Post reactions use a keyboard-accessible disclosure to avoid crowded action rows.

## Frontend validation and performance

```bash
npm ci
npm test
npm run build
npm run preview -- --port 5173
```

`npm test` builds a disposable bundle in ignored `.cache/` and exercises navigation, the landing/feed split, catalogue ratings, authentication, polls, likes, chat, composition, profile editing, and messages with jsdom. PHP feature tests still require the Laravel/PHP environment described above.

Performance work in this redesign:
- Removed the unused previous hero image, obsolete hero CSS, and unused bootstrap placeholder; retained backend files and functional routes.
- Optimized inline SVG icon paths, reducing the production app JavaScript from approximately **174.5 kB to about 165 kB** (gzip **49.0 kB to about 48 kB**), including the catalogue, messaging safety UI, and 60 illustrated skills.
- Hero artwork is approximately **63 kB desktop / 22 kB mobile**, selected with `srcset` and `sizes`, with explicit dimensions and high loading priority. The old hero was 76 kB on all devices.
- Decorative SVGs are under 1 kB each, cacheable, and lazy-loaded; fonts remain self-hosted with `font-display: swap` and unicode-range selection. No remote image/font requests are required.
- Existing Apache compression and static-asset caching remain in `public/.htaccess`. Production performance should be measured on the deployed host; these asset-size improvements are not a promise about network speed or Core Web Vitals.

The privacy and terms pages are operational starter copy. Review them with the site operator or legal adviser for the jurisdictions and data retention practices that apply before public launch.

## Catalogue and profile update

Migration `2026_10_14_000014_create_ai_model_catalogue.php` creates the admin-managed catalogue and unique member/model ratings, and adds launch SEO descriptions (160 characters). Run `php artisan migrate` before serving the updated application. Production starts with an empty catalogue: administrators create, edit, and archive entries at `/admin`. Archiving preserves ratings. Authenticated active members rate from 1–5; changing a score updates the existing rating. Legacy model-share posts are retained in storage but excluded from public discovery; members can publish posts, questions, polls, and launches instead.

Profile settings use normal document scrolling, 60 illustrated skill suggestions, 16 original character avatars, and refreshed layered covers. Existing avatar choices and uploads remain supported. Demo catalogue management and ratings are browser-local simulations, not shared server data.

Validation for this update: production frontend build and automated smoke/moderation tests passed; Chromium checks covered public routes at 320, 390, 768, 1024, and 1440 pixels, profile save/reload, and demo admin catalogue create/archive. The homepage axe scan found no tested WCAG A/AA violations. PHP sources were syntax-parsed only: **Laravel feature tests and migrations were not executed because this environment has no PHP runtime**. Run `php artisan test` in a configured PHP environment before deployment.
