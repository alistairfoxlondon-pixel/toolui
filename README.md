# VibeDock

VibeDock is a Laravel community for people who make AI tools, apps, and creative projects. Members can publish discussions, questions, polls, and launches; upload post images and project logos; vote on launches; build professional profiles; follow and friend other makers; send private messages; and join a shared community chat. Administrators can review reports, manage accounts and posts, and remove group chat messages.

The information architecture and content are original. The linked repository informed visual qualities only. The interface uses a mobile first layout, solid color surfaces, smaller corner radii, accessible controls, and responsive navigation.

## Stack

- Laravel 12 and PHP 8.2 or newer
- MySQL or compatible MariaDB
- Vite for production CSS and JavaScript assets
- File sessions, file cache, and synchronous jobs for shared hosting
- PHP GD and DOM extensions for image resizing and safe SVG logo handling

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

- `/` is the community feed.
- `/launches` is the project showcase with launch votes.
- `/rankings` lists AI tools and apps and a rolling engagement leaderboard.
- `/community-chat` is the shared member chat. It refreshes every 12 seconds without a websocket server.
- `/u/{username}` is a public professional profile.
- `/messages` is private member chat and requires an accepted friendship.
- `/about`, `/guidelines`, `/privacy`, and `/terms` are accessible information pages.
- `/admin` is restricted to administrators.

Migrations create the community profiles, posts, comments, polls, likes, reactions, launch votes, reports, follows, friend requests, direct messages, group chat, and social account links. SVG launch logos are sanitized before storage. Profile photos and raster logos are resized when GD is available. Reports, account controls, and chat moderation are managed from the admin area.

## Typography and release notes

The CSS font stack requests `Telenor Evolution` and `Telenor` first. A licensed Telenor font file could not be verified for redistribution, so no claim is made that the exact Grameenphone typeface is bundled. The visual result falls back to the installed system sans serif unless the licensed family is available on the deployment system. Replace or add a licensed self hosted font asset when its source and redistribution terms are confirmed.

The privacy and terms pages are operational starter copy. Review them with the site operator or legal adviser for the jurisdictions and data retention practices that apply before public launch.
