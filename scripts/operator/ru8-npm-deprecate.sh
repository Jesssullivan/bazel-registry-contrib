#!/usr/bin/env bash
# RU8 / RV18 / RV19 operator script: deprecate every in-house npm package.
#
# Written 2026-10-15 by the U4 deprecate lane (sprint-rs). NOT executed by any
# agent: npm is not logged in on neo (E401) and lanes must not log in or use a
# token they find. The operator runs this with their own npm login (the
# maintainer of the @tummycrypt scope and the oauth-mux / tubebrain names,
# npm user xoxdjess). It contains no secrets.
#
# What it does: one `npm deprecate <name>@"*" "<message>"` per package, so
# every published version of all 77 packages (69 @tummycrypt/* plus oauth-mux
# and its 6 platform packages, and tubebrain) shows a deprecation pointer to
# its Bazel module in xoxd-ai/bazel-registry, or to its GitHub repo when no
# module exists. Nothing is unpublished (RU8). npm applies "*" to prerelease
# versions too (remote-juggler 2.1.0-beta.*, tubebrain 0.1.x).
#
# Module names and retirement targets were read live on 2026-10-15 from
# xoxd-ai/bazel-registry main c2f6411 (modules/*/metadata.json "deprecated").
# The npm names were read live from registry.npmjs.org the same day: 77
# packages, none deprecated except oauth-mux-{darwin,linux}-{arm64,x64}@0.1.1
# (those messages get overwritten here).
#
# Usage:  npm login   (operator, interactive; npm whoami must print the maintainer)
#         bash ru8-npm-deprecate.sh
# Re-running is safe: npm deprecate just rewrites the message.
#
# GitHub Packages: the GitHub REST/GraphQL package APIs have no deprecate
# operation (only list, delete and restore), whether npm.pkg.github.com honours
# `npm deprecate` is untested, and changing a package description needs a
# publish, which RU8 forbids. Those packages are recorded at the bottom and
# left in place.

set -u

if ! npm whoami >/dev/null 2>&1; then
  echo "npm is not logged in; run 'npm login' as the package maintainer first." >&2
  exit 1
fi
echo "npm user: $(npm whoami)"


# --- Live Bazel module ---
npm deprecate @tummycrypt/acuity-middleware@"*" "Moved to the Bazel module tummycrypt_scheduling_bridge (repo renamed to xoxd-ai/scheduling-bridge) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/scheduling-bridge@"*" "Moved to the Bazel module tummycrypt_scheduling_bridge in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/scheduling-kit@"*" "Moved to the Bazel module tummycrypt_scheduling_kit in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-a11y-engine@"*" "Moved to the Bazel module tummycrypt_tinyland_a11y_engine in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-activitypub@"*" "Moved to the Bazel module tummycrypt_tinyland_activitypub in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-admin-user-repository@"*" "Moved to the Bazel module tummycrypt_tinyland_auth (@tummycrypt/tinyland-auth/admin-user-repository, 1.1.0+) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-admin-user-service@"*" "Moved to the Bazel module tummycrypt_tinyland_admin_user_service in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-auth@"*" "Moved to the Bazel module tummycrypt_tinyland_auth in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-auth-pg@"*" "Moved to the Bazel module tummycrypt_tinyland_auth_pg in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-auth-redis@"*" "Moved to the Bazel module tummycrypt_tinyland_auth_redis in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-business-pg@"*" "Moved to the Bazel module tummycrypt_tinyland_business_pg in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-caldav-client@"*" "Moved to the Bazel module tummycrypt_tinyland_caldav_client in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-calendar@"*" "Moved to the Bazel module tummycrypt_tinyland_calendar in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-color-utils@"*" "Moved to the Bazel module tummycrypt_tinyland_color_utils in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-composables@"*" "Moved to the Bazel module tummycrypt_tinyland_composables in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-content@"*" "Moved to the Bazel module tummycrypt_tinyland_content in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-content-types@"*" "Moved to the Bazel module tummycrypt_tinyland_content_types in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-fingerprint@"*" "Moved to the Bazel module tummycrypt_tinyland_fingerprint in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-grafana@"*" "Moved to the Bazel module tummycrypt_tinyland_grafana in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-invitation@"*" "Moved to the Bazel module tummycrypt_tinyland_invitation in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-logging@"*" "Moved to the Bazel module tummycrypt_tinyland_logging in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-offer-builder@"*" "Moved to the Bazel module tummycrypt_tinyland_offer_builder in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-otel@"*" "Moved to the Bazel module tummycrypt_tinyland_otel in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-rate-limit@"*" "Moved to the Bazel module tummycrypt_tinyland_rate_limit in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-schemas@"*" "Moved to the Bazel module tummycrypt_tinyland_schemas in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-security@"*" "Moved to the Bazel module tummycrypt_tinyland_security in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-server-config@"*" "Moved to the Bazel module tummycrypt_tinyland_server_config in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-server-utils@"*" "Moved to the Bazel module tummycrypt_tinyland_server_utils in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-stores@"*" "Moved to the Bazel module tummycrypt_tinyland_stores in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyvectors@"*" "Moved to the Bazel module tummycrypt_tinyvectors in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/vite-plugin-a11y@"*" "Moved to the Bazel module tummycrypt_vite_plugin_a11y in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/vite-plugin-skeleton-colors@"*" "Moved to the Bazel module tummycrypt_vite_plugin_skeleton_colors in xoxd-ai/bazel-registry; npm releases are retired."

# --- Merged into another Bazel module (subpath export) ---
npm deprecate @tummycrypt/tinyland-a11y-logger@"*" "Moved to the Bazel module tummycrypt_tinyland_logging (@tummycrypt/tinyland-logging/a11y) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-activity-feed@"*" "Moved to the Bazel module tummycrypt_tinyland_content (@tummycrypt/tinyland-content/activity-feed) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-activity-logger@"*" "Moved to the Bazel module tummycrypt_tinyland_logging (@tummycrypt/tinyland-logging/activity) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-admin-audit@"*" "Moved to the Bazel module tummycrypt_tinyland_logging (@tummycrypt/tinyland-logging/admin-audit) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-analytics-data@"*" "Moved to the Bazel module tummycrypt_tinyland_otel (@tummycrypt/tinyland-otel/analytics-data) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-event-loader@"*" "Moved to the Bazel module tummycrypt_tinyland_content (@tummycrypt/tinyland-content/event-loader) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-ip-bans@"*" "Moved to the Bazel module tummycrypt_tinyland_security (@tummycrypt/tinyland-security/ip-bans) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-logging-middleware@"*" "Moved to the Bazel module tummycrypt_tinyland_logging (@tummycrypt/tinyland-logging/middleware) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-metrics@"*" "Moved to the Bazel module tummycrypt_tinyland_otel (@tummycrypt/tinyland-otel/metrics) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-metrics-collectors@"*" "Moved to the Bazel module tummycrypt_tinyland_otel (@tummycrypt/tinyland-otel/metrics-collectors) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-product-loader@"*" "Moved to the Bazel module tummycrypt_tinyland_content (@tummycrypt/tinyland-content/product-loader) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-profile-loader@"*" "Moved to the Bazel module tummycrypt_tinyland_content (@tummycrypt/tinyland-content/profile-loader) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-prometheus@"*" "Moved to the Bazel module tummycrypt_tinyland_otel (@tummycrypt/tinyland-otel/prometheus) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-publishing-hooks@"*" "Moved to the Bazel module tummycrypt_tinyland_content (@tummycrypt/tinyland-content/publishing-hooks) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-scheduled-publishing@"*" "Moved to the Bazel module tummycrypt_tinyland_content (@tummycrypt/tinyland-content/scheduled-publishing) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-threat-detection@"*" "Moved to the Bazel module tummycrypt_tinyland_security (@tummycrypt/tinyland-security/threat-detection) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-user-resolution@"*" "Moved to the Bazel module tummycrypt_tinyland_content (@tummycrypt/tinyland-content/user-resolution) in xoxd-ai/bazel-registry; npm releases are retired."
npm deprecate @tummycrypt/tinyland-video-thumbnails@"*" "Moved to the Bazel module tummycrypt_tinyland_content (@tummycrypt/tinyland-content/video-thumbnails) in xoxd-ai/bazel-registry; npm releases are retired."

# --- Bazel module retired ---
npm deprecate @tummycrypt/tinyland-admin-data@"*" "Retired with no replacement (last Bazel module tummycrypt_tinyland_admin_data, deprecated, in xoxd-ai/bazel-registry); npm releases are retired."
npm deprecate @tummycrypt/tinyland-admin-validation@"*" "Retired (Bazel module tummycrypt_tinyland_admin_validation deprecated in xoxd-ai/bazel-registry); admin roles live in tummycrypt_tinyland_auth; npm releases are retired."
npm deprecate @tummycrypt/tinyland-analytics@"*" "Retired with no replacement (last Bazel module tummycrypt_tinyland_analytics, deprecated, in xoxd-ai/bazel-registry); npm releases are retired."
npm deprecate @tummycrypt/tinyland-credentials-generator@"*" "Retired with no replacement (last Bazel module tummycrypt_tinyland_credentials_generator, deprecated, in xoxd-ai/bazel-registry); npm releases are retired."
npm deprecate @tummycrypt/tinyland-credentials-helper@"*" "Retired with no replacement (last Bazel module tummycrypt_tinyland_credentials_helper, deprecated, in xoxd-ai/bazel-registry); npm releases are retired."
npm deprecate @tummycrypt/tinyland-file-logger@"*" "Retired (Bazel module tummycrypt_tinyland_file_logger deprecated in xoxd-ai/bazel-registry); use the Bazel module tummycrypt_tinyland_logging; npm releases are retired."
npm deprecate @tummycrypt/tinyland-forms@"*" "Retired (Bazel module tummycrypt_tinyland_forms deprecated in xoxd-ai/bazel-registry); use SvelteKit remote form() with Standard Schema; npm releases are retired."
npm deprecate @tummycrypt/tinyland-ip-location@"*" "Retired with no replacement (last Bazel module tummycrypt_tinyland_ip_location, deprecated, in xoxd-ai/bazel-registry); npm releases are retired."
npm deprecate @tummycrypt/tinyland-physics@"*" "Retired (Bazel module tummycrypt_tinyland_physics deprecated in xoxd-ai/bazel-registry); successor is the Bazel module tummycrypt_tinyvectors; npm releases are retired."
npm deprecate @tummycrypt/tinyland-tracing-middleware@"*" "Retired (Bazel module tummycrypt_tinyland_tracing_middleware deprecated in xoxd-ai/bazel-registry); use the Bazel module tummycrypt_tinyland_otel; npm releases are retired."
npm deprecate @tummycrypt/tinyland-types@"*" "Retired (Bazel module tummycrypt_tinyland_types deprecated in xoxd-ai/bazel-registry); use the Bazel module tummycrypt_tinyland_content_types; npm releases are retired."
npm deprecate @tummycrypt/tinyland-websocket-metrics@"*" "Retired (Bazel module tummycrypt_tinyland_websocket_metrics deprecated in xoxd-ai/bazel-registry); use the Bazel module tummycrypt_tinyland_otel; npm releases are retired."

# --- No Bazel module, source repo archived ---
npm deprecate @tummycrypt/tinyland-blog-loader@"*" "Retired with no Bazel module; source archived at github.com/xoxd-ai/tinyland-blog-loader; npm releases are retired."
npm deprecate @tummycrypt/tinyland-content-loader@"*" "Retired with no Bazel module; source archived at github.com/xoxd-ai/tinyland-content-loader; npm releases are retired."
npm deprecate @tummycrypt/tinyland-dual-source-loader@"*" "Retired with no Bazel module; source archived at github.com/xoxd-ai/tinyland-dual-source-loader; npm releases are retired."
npm deprecate @tummycrypt/tinyland-tempo-utils@"*" "Retired with no Bazel module; source archived at github.com/xoxd-ai/tinyland-tempo-utils; npm releases are retired."
npm deprecate @tummycrypt/tinyland-user-content@"*" "Retired with no Bazel module; source archived at github.com/xoxd-ai/tinyland-user-content; npm releases are retired."

# --- No Bazel module, live GitHub repo (CLI/binary distributions, RV19) ---
npm deprecate @tummycrypt/remote-juggler@"*" "No longer published to npm; use the GitHub releases of github.com/Jesssullivan/remote-juggler (no Bazel module); npm releases are retired."
npm deprecate @tummycrypt/yt-text@"*" "Renamed to tubebrain; use the GitHub releases of github.com/Jesssullivan/tubebrain (no Bazel module); npm releases are retired."
npm deprecate oauth-mux@"*" "No longer published to npm; use the GitHub releases of github.com/Jesssullivan/oauth-mux (no Bazel module); npm releases are retired."
npm deprecate oauth-mux-darwin-arm64@"*" "No longer published to npm; use the GitHub releases of github.com/Jesssullivan/oauth-mux (no Bazel module); npm releases are retired."
npm deprecate oauth-mux-darwin-x64@"*" "No longer published to npm; use the GitHub releases of github.com/Jesssullivan/oauth-mux (no Bazel module); npm releases are retired."
npm deprecate oauth-mux-linux-arm64@"*" "No longer published to npm; use the GitHub releases of github.com/Jesssullivan/oauth-mux (no Bazel module); npm releases are retired."
npm deprecate oauth-mux-linux-x64@"*" "No longer published to npm; use the GitHub releases of github.com/Jesssullivan/oauth-mux (no Bazel module); npm releases are retired."
npm deprecate oauth-mux-windows-arm64@"*" "No longer published to npm; use the GitHub releases of github.com/Jesssullivan/oauth-mux (no Bazel module); npm releases are retired."
npm deprecate oauth-mux-windows-x64@"*" "No longer published to npm; use the GitHub releases of github.com/Jesssullivan/oauth-mux (no Bazel module); npm releases are retired."
npm deprecate tubebrain@"*" "No longer published to npm; use the GitHub releases of github.com/Jesssullivan/tubebrain (no Bazel module); npm releases are retired."

# --- Readback: every package must print a deprecation message ---
missing=0
for p in @tummycrypt/acuity-middleware @tummycrypt/remote-juggler @tummycrypt/scheduling-bridge @tummycrypt/scheduling-kit @tummycrypt/tinyland-a11y-engine @tummycrypt/tinyland-a11y-logger @tummycrypt/tinyland-activity-feed @tummycrypt/tinyland-activity-logger @tummycrypt/tinyland-activitypub @tummycrypt/tinyland-admin-audit @tummycrypt/tinyland-admin-data @tummycrypt/tinyland-admin-user-repository @tummycrypt/tinyland-admin-user-service @tummycrypt/tinyland-admin-validation @tummycrypt/tinyland-analytics @tummycrypt/tinyland-analytics-data @tummycrypt/tinyland-auth @tummycrypt/tinyland-auth-pg @tummycrypt/tinyland-auth-redis @tummycrypt/tinyland-blog-loader @tummycrypt/tinyland-business-pg @tummycrypt/tinyland-caldav-client @tummycrypt/tinyland-calendar @tummycrypt/tinyland-color-utils @tummycrypt/tinyland-composables @tummycrypt/tinyland-content @tummycrypt/tinyland-content-loader @tummycrypt/tinyland-content-types @tummycrypt/tinyland-credentials-generator @tummycrypt/tinyland-credentials-helper @tummycrypt/tinyland-dual-source-loader @tummycrypt/tinyland-event-loader @tummycrypt/tinyland-file-logger @tummycrypt/tinyland-fingerprint @tummycrypt/tinyland-forms @tummycrypt/tinyland-grafana @tummycrypt/tinyland-invitation @tummycrypt/tinyland-ip-bans @tummycrypt/tinyland-ip-location @tummycrypt/tinyland-logging @tummycrypt/tinyland-logging-middleware @tummycrypt/tinyland-metrics @tummycrypt/tinyland-metrics-collectors @tummycrypt/tinyland-offer-builder @tummycrypt/tinyland-otel @tummycrypt/tinyland-physics @tummycrypt/tinyland-product-loader @tummycrypt/tinyland-profile-loader @tummycrypt/tinyland-prometheus @tummycrypt/tinyland-publishing-hooks @tummycrypt/tinyland-rate-limit @tummycrypt/tinyland-scheduled-publishing @tummycrypt/tinyland-schemas @tummycrypt/tinyland-security @tummycrypt/tinyland-server-config @tummycrypt/tinyland-server-utils @tummycrypt/tinyland-stores @tummycrypt/tinyland-tempo-utils @tummycrypt/tinyland-threat-detection @tummycrypt/tinyland-tracing-middleware @tummycrypt/tinyland-types @tummycrypt/tinyland-user-content @tummycrypt/tinyland-user-resolution @tummycrypt/tinyland-video-thumbnails @tummycrypt/tinyland-websocket-metrics @tummycrypt/tinyvectors @tummycrypt/vite-plugin-a11y @tummycrypt/vite-plugin-skeleton-colors @tummycrypt/yt-text oauth-mux oauth-mux-darwin-arm64 oauth-mux-darwin-x64 oauth-mux-linux-arm64 oauth-mux-linux-x64 oauth-mux-windows-arm64 oauth-mux-windows-x64 tubebrain; do
  msg="$(npm view "$p" deprecated 2>/dev/null | head -1)"
  if [ -z "$msg" ]; then echo "NOT DEPRECATED: $p"; missing=$((missing + 1)); fi
done
echo "readback done: $missing of 77 packages without a deprecation message"

# --- GitHub Packages (record only; nothing to run) ---
# Read live 2026-10-15 with a read:packages token (sting gh login):
#   gh api "users/Jesssullivan/packages?package_type=npm&per_page=100"
#   gh api --paginate "orgs/xoxd-ai/packages?package_type=npm&per_page=100"
# Jesssullivan (npm.pkg.github.com, scope @jesssullivan):
#   scheduling-bridge (public, 29 versions) -> tummycrypt_scheduling_bridge
#   scheduling-kit (private, 19) -> tummycrypt_scheduling_kit
#   acuity-middleware (private, 1) -> tummycrypt_scheduling_bridge
#   tubebrain (private, 1) and yt-text (private, 2) -> github.com/Jesssullivan/tubebrain
# xoxd-ai (65 private npm packages: the tinyland-* set, vite-plugin-a11y,
#   vite-plugin-skeleton-colors, tinyvectors and a scheduling-kit legacy mirror;
#   every one with updated_at 2026-09-19).
# xoxd-ai package names (scope @xoxd-ai on npm.pkg.github.com):
#   scheduling-kit tinyland-a11y-engine tinyland-a11y-logger
#   tinyland-activity-feed tinyland-activity-logger tinyland-activitypub
#   tinyland-admin-audit tinyland-admin-data tinyland-admin-user-repository
#   tinyland-admin-user-service tinyland-admin-validation tinyland-analytics
#   tinyland-analytics-data tinyland-auth tinyland-auth-pg tinyland-auth-redis
#   tinyland-blog-loader tinyland-business-pg tinyland-caldav-client
#   tinyland-calendar tinyland-color-utils tinyland-composables
#   tinyland-content tinyland-content-loader tinyland-content-types
#   tinyland-credentials-generator tinyland-credentials-helper
#   tinyland-dual-source-loader tinyland-event-loader tinyland-file-logger
#   tinyland-fingerprint tinyland-forms tinyland-grafana tinyland-invitation
#   tinyland-ip-bans tinyland-ip-location tinyland-logging
#   tinyland-logging-middleware tinyland-metrics tinyland-metrics-collectors
#   tinyland-offer-builder tinyland-otel tinyland-physics
#   tinyland-product-loader tinyland-profile-loader tinyland-prometheus
#   tinyland-publishing-hooks tinyland-rate-limit
#   tinyland-scheduled-publishing tinyland-schemas tinyland-security
#   tinyland-server-config tinyland-server-utils tinyland-stores
#   tinyland-tempo-utils tinyland-threat-detection tinyland-tracing-middleware
#   tinyland-types tinyland-user-content tinyland-user-resolution
#   tinyland-video-thumbnails tinyland-websocket-metrics tinyvectors
#   vite-plugin-a11y vite-plugin-skeleton-colors
# The private ones are visible only to org members. Leave every version in
# place (RU8). A visible pointer without publishing is only possible through
# the linked repository README or the package settings page in the GitHub UI.
