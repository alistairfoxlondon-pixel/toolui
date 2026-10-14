# VibeDock

VibeDock is a Laravel community for people who make AI tools, apps, and creative projects. Members can publish discussions, questions, polls, and launches with SEO descriptions; upload post images and project logos; vote on launches; build professional profiles with library avatars and predefined cover designs; follow and friend other makers; send private messages; and join a shared community chat. Members compare AI models through community polls, earn activity badges, and claim a brand handle for a launch. Administrators can award recognition badges and review brand ownership for a green verified-business tick. Administrators can review reports, feature or hide posts, manage accounts, posts, and comments, and remove group chat messages.

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
- Polls live in the community feed. Use the **Polls** feed filter to browse them; legacy `/polls` and `/models` links permanently redirect to `/feed?filter=poll`. Catalogue API/admin routes are retired.
- `/create/post`, `/create/question`, `/create/poll`, and `/create/launch` are independent creation pages, not a shared modal.
- `/brands/{slug}` opens the claimed brand’s launch.
- `/badges` explains activity milestones and admin recognition; `/help` explains the main features.
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

Profile editing includes 80 searchable skill suggestions, each with an original inline vector icon. Members may select up to 12 skills or enter custom skills (32 characters each). Server validation retains the same limits.

`npm test` covers sign-in, direct-message persistence, community sending, automatic rejection, report/block/unblock flows, and illustrated skill selection. `tests/Feature/MessageSafetyTest.php` covers Laravel participant isolation, report authorization, bidirectional blocking, moderation, admin review, and latest-message ordering. Run `php artisan test` in a PHP/Laravel environment. This sandbox has no PHP runtime: the Laravel feature suite and migrations have **not** been executed here.

## Typography and artwork

The primary font stack is `Telenor GP` (genuine local/licensed faces), `Telenor Evolution`, `Telenor`, then the self-hosted, OFL-licensed Figtree variable font. **The exact Grameenphone/Telenor font is not bundled**: a licensed file was not supplied and redistribution rights could not be verified. Browsers without Telenor installed render Figtree, not an imitation renamed as Telenor.

To activate appropriately licensed webfonts for every visitor, supply `Telenor-Regular.woff2`, `Telenor-Medium.woff2`, and `Telenor-Bold.woff2` in `public/fonts/telenor/`. Restart preview or rebuild production. The shared Vite plugin detects available files, adds versioned same-origin font URLs and `font-display: swap`, and does not request missing files. Deploy the font directory alongside `public/build`. See `public/fonts/telenor/README.md`. Do not hotlink third-party font files or claim the fallback is Telenor.

The green-and-ink homepage uses an original AI-generated human illustration exported as background-free, responsive WebP assets (880px and 440px). The SVG illustrations, including the launch and poll scenes, and two-tone UI icons are original project assets reused across discovery, launches, polls, rankings, and information pages. They are not copies of the supplied commercial reference packs; the reference image URLs could not be fetched in this environment.

The homepage keeps its hero under 30 words, using image-led navigation rather than repeated explanatory copy. About and Guidelines retain the fuller context. On phones, search expands on demand, a native feed filter exposes every category, and labeled composer controls remain visible. Every post has a visible, labelled reaction bar, with a compact named 3-by-2 picker when requested.

## Frontend validation and performance

```bash
npm ci
npm test
npm run build
npm run preview -- --port 5173
```

`npm test` builds a disposable bundle in ignored `.cache/` and exercises navigation, the landing/feed split, catalogue retirement, authentication, polls, likes, chat, composition, profile editing, and messages with jsdom. PHP feature tests still require the Laravel/PHP environment described above.

Performance work in this redesign:
- Removed the unused previous hero image, obsolete hero CSS, and unused bootstrap placeholder; retained backend files and functional routes.
- Inline SVG icon paths and self-hosted assets avoid third-party UI requests. Unchanged feed cards are reused instead of re-created, preserving decoded images, focus, and comment drafts.
- Hero artwork is approximately **63 kB desktop / 22 kB mobile**, selected with `srcset` and `sizes`, with explicit dimensions and high loading priority. The old hero was 76 kB on all devices.
- SVG illustrations and local avatar artwork are cacheable and lazy-loaded; fonts remain self-hosted with `font-display: swap` and unicode-range selection. No remote image/font requests are required.
- Existing Apache compression and static-asset caching remain in `public/.htaccess`. Production performance should be measured on the deployed host; these asset-size improvements are not a promise about network speed or Core Web Vitals.

The privacy and terms pages are operational starter copy. Review them with the site operator or legal adviser for the jurisdictions and data retention practices that apply before public launch.

## Badges, brand claims, and dedicated creation pages

Run `php artisan migrate` before deploying. Migration `2026_10_14_000015_add_member_badges_and_brand_claims.php` adds `member_badges` and `brands`. The earlier catalogue migration is retained (including its SEO-description column) to preserve migration history and existing data. No catalogue data is deleted; catalogue routes and controls are no longer exposed.

- **Creation:** Four independent URLs with type-specific forms and metadata. Guests can open the pages and sign in without losing the intended destination. The launch studio includes a text preview, project logo, optional screenshot, SEO description, and optional brand claim. Failed submissions preserve the form; duplicate submits are guarded.
- **Activity badges:** First contribution, 10 visible contributions, first launch, 3 polls, or 10 comments on visible content. These are computed on profile requests, not by adding queries to every feed card. Hidden/deleted content and reposts do not count toward publishing milestones.
- **Admin badges:** Community star, Expert, and Early supporter can be awarded or revoked in each member’s admin controls. Database uniqueness prevents duplicate awards; the awarding administrator is recorded. Members cannot self-award.
- **Brand claims:** Optional lowercase 3–40-character handle (letters, numbers, internal hyphens), with an authorization confirmation. Publishing creates the post and claim in one transaction. A unique database index prevents competing claims; validation alone is not relied upon. A handle is tied to one launch. Deleting that launch releases the handle; hiding it keeps the reservation but hides its public page. A claim is not trademark registration.
- **Verification:** Claims start pending, never verified. In `/admin#brands`, independently confirm control of the linked project (for example, via a challenge on its website or documented ownership) before selecting Verified ownership. The green tick is only shown for an admin-verified claim; rejecting or returning to pending revokes it. The last reviewer and review time are recorded. There is no automated domain verification or payment-based verification.
- **Avatars:** 24 original VibeDock SVG illustrations, organized as Makers, Creatures, and Sidekicks. The shared alias map upgrades retired portrait keys to this cohesive library without invalidating saved profiles; uploads are unchanged. The retired Fluent source and generated WebPs remain archived only for old external links.
- **Preview:** Posts, claims, badge awards, and verification controls are browser-local demonstrations. They are not production authorization or shared state. Google/Facebook controls are shown but explain the demo limitation; actual OAuth runs only through the configured Laravel routes.
- **Typography:** Telenor remains first in the font stack, with a self-hosted fallback. You must supply licensed WOFF2 files to activate it for visitors who do not have it installed. No proprietary font was downloaded or substituted under its name.

The homepage retains its hero, palette, section order, and feature-card layout. Copy is shorter, the old catalogue card explains badges, artwork is contained rather than cropped, and missing images have a non-looping fallback.

### Validation for this update

`npm test` covers catalogue retirement into the feed, separate creation routes, Google/Facebook entry points, refreshed CSRF, existing community interactions, profile editing and new avatars. `npm run build` produces production assets. Chromium responsive checks passed on 12 pages at 320, 390, 768, and 1440 pixels (48 checks), with no horizontal overflow, broken image requests, cropped feature artwork, or JavaScript exceptions in those checks. Interaction checks cover the dedicated forms, brand claim/duplicate rejection, local admin badge award/revocation, local verification/revocation, poll voting, and avatar save/reload. These checks are not a guarantee that every issue on the site is fixed.

`tests/Feature/BadgesAndBrandsTest.php` covers route separation, claim validation/uniqueness, optional claims, visibility, non-self-verification, admin-only awards/revocation, and activity badges. **PHP/Laravel tests and migrations have not run in this sandbox because PHP and Composer are unavailable.** Run `php artisan test` on a configured PHP environment before production. Live Google/Facebook OAuth also requires credentials and provider callback testing on the deployment domain.

## Earlier performance and upload polish (historical measurements)

- Removed 21 unreachable Material icon variants (original illustrated icons still render exactly as before). Icon and skill markup is memoized with bounded caches. The production application JS changed from 176.61 kB / 52.20 kB gzip to 170.02 kB / 51.37 kB gzip, including the new upload controls. These are bundle-size measurements, not measured production latency or Core Web Vitals.
- Opening/closing dialogs no longer regenerates the underlying page/feed. Rankings no longer fetch an unused 60-post feed. Fingerprinted JS/CSS/font assets can use a one-year immutable Apache cache; HTML, private JSON, and ordinary uploads are excluded.
- Feed/profile/ranking relations load only the current viewer's like membership rather than hydrating every liker. Database counts still reflect everyone, including on repost sources. Source counts are batch-loaded instead of calculated lazily per post.
- Corrected avatar/cover stacking and removed the settings Save bar's overlapping sticky behavior. The page layout, spacing, artwork, and interactions otherwise remain unchanged.
- Styled, keyboard-accessible upload labels replace native-looking file controls for photos, post images, and project logos. Selected filenames, file limits, Remove, and avatar preview/reset are supported. Preview SVG logos now show an explicit unsupported-preview message instead of silently disappearing; production SVG processing is unchanged.
- Added stale-profile-response protection, profile return-navigation regression coverage, and clear errors for non-JSON success responses.

Verification: frontend regression/smoke tests and production build pass. Chromium checks cover avatar visibility, file selection/removal/validation, and picker overlap at 320, 390, 768, and 1440 pixels, plus the existing 24 responsive community checks. Backend eager-loading assertions have been added but require `php artisan test` on a configured PHP environment; PHP is not installed in this sandbox. No licensed Telenor binaries have been supplied, so visitors without that font locally installed still use Figtree.

## Illustrated avatars and reactions

- The active avatar library contains **24 original SVG illustrations**. SVG keeps their linework sharp from compact feed avatars through the profile preview while each source stays below 3 kB. Header/profile avatars load eagerly; feed and picker images load lazily.
- Profile settings use three eight-character collections: **Makers**, **Creatures**, and **Sidekicks**. Unopened collections contain request-free placeholders. Switching collections preserves the selected radio value, and Random rotates within the open collection.
- Retired Fluent portrait keys, their former PNG/SVG paths, and versioned WebP URLs resolve through a shared alias map to the active original illustrations. Saved profiles and uploaded photos remain valid.
- Every post, poll, question, launch and repost has a compact **React** control. Selecting it opens named **Love, Celebrate, Helpful, Support, Haha, and Wow** choices in a clear 3-by-2 panel using Material Symbols Rounded—not emoji artwork. Love preserves the existing like counts/API. One additional reaction per member can be switched or removed by selecting it again. Existing reaction data remains valid; no new reaction migration is required (the column is a string).
- Reaction mutations are guarded against rapid duplicate clicks; failures retain the previous choice. Only reaction controls update, preserving decoded post images and reply drafts. Original/repost copies stay in sync. Backend reaction updates are transactional and still require an active authenticated account.

Validation: frontend tests check local SVG avatar paths, deferred collections, selection/save/reload, reaction switching/removal, and retained replies. PHP tests for avatar assets and reaction authorization/persistence are included in `tests/Feature/AvatarReactionsTest.php`; they still require a configured PHP/Laravel environment to execute.
