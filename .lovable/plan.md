# Add SmartLinks to AdProfitly

## Scope
- Preserve the homepage, current dashboard pages, styling, layout, and all existing workflows.
- Add one `SmartLinks` entry to the existing publisher navigation and one matching dashboard page at `/dashboard/smartlinks` (the current authenticated publisher route convention).
- Add the public branded redirect at `/go/{slug}`.

## Publisher experience
- Build a lightweight SmartLinks page using the dashboard's current heading, dialog, metric-card, chart, badge, table, and action-menu patterns.
- Creation flow: `Create SmartLink` → name and traffic source → generate → copy `https://adprofitly.com/go/{unique-slug}`.
- Table: Name, Link, Status, Clicks, Revenue, CPM, Actions.
- Actions: Copy, Analytics, Pause/Activate, and confirmed Delete.
- Analytics view includes revenue, clicks, impressions, CTR, CPM, daily revenue, country, device, and referrer with Today, Yesterday, Last 7 Days, Last 30 Days, This Month, and Custom Range filters.

## Secure backend and redirect
- Add authenticated server functions for create, list, update status, delete, analytics, and sync. Every operation derives the publisher from the verified session and cannot access another publisher's records.
- Keep `ADSTERRA_API_TOKEN` server-only and isolate all Adsterra-specific requests/mapping in an Adsterra provider behind a small network-provider interface.
- Generate a unique per-link PSID/sub-ID for attribution and store only the approved network destination returned/configured by the provider.
- `/go/{slug}` validates active state, uses only the stored approved network destination, appends the server-owned attribution value, records a minimal event, applies short-window IP-fingerprint rate limits plus bot/suspicious-user-agent checks, and redirects quickly.
- Block arbitrary redirect URLs and never return provider credentials or long network URLs to publisher-facing responses.

## Data and automatic sync
- Add the minimum requested tables: `networks`, `smart_links`, `network_stats`, `publisher_earnings`, `traffic_events`, and `api_sync_logs`.
- Add strict row-level access so publishers can only read/manage their own SmartLinks and reporting rows; provider configuration, raw destinations, traffic fingerprints, and sync logs remain backend-only.
- Add indexes and uniqueness rules for slugs, PSIDs, daily stat upserts, ownership, and redirect/rate-limit lookups.
- Add a signed public sync endpoint suitable for a scheduled job, plus a manual sync-on-page-open fallback. Both use the same idempotent provider sync service.
- Aggregate network totals into publisher earnings using each publisher's configured revenue share.

## Adsterra integration constraint
- Use only endpoints and fields supported by the current Adsterra Publisher API. If the API exposes reporting but not SmartLink creation, V1 will bind generated branded links to an approved SmartLink placement returned by the account API rather than inventing an unsupported API call.
- Request the Adsterra token through the secure secret form; it will not appear in code or chat.

## Verification
- Apply the database migration and regenerate backend types.
- Verify authenticated create/copy/pause/activate/delete and date-filtered analytics.
- Verify `/go/{slug}` for active, paused, missing, bot-like, and burst-request cases, including protection against arbitrary redirects.
- Check desktop and mobile rendering, metadata, runtime errors, and the latest build result without changing existing screens.

## Technical details
- Use TanStack Start server functions for authenticated app actions and TanStack server routes for `/go/{slug}` and the signed scheduler endpoint.
- Use Web-standard APIs and edge-compatible code only.
- Store only a one-way IP fingerprint, not a raw IP address; VPN/proxy detection remains optional and disabled unless a free signal is already available.
