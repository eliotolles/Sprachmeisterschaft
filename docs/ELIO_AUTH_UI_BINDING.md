# Existing authentication controls: compatibility binding

The existing login/register/Google modal handlers now await asynchronous authentication. Existing JSX markup, class names, layout and styles remain unchanged. Logout waits for the server response and uses the existing toast/error surface on failure. Application bootstrap initializes the binding before mounting React, preventing forged persisted users from flashing as authenticated in core mode.

The server must explicitly return both enabled=true and uiAuthEnabled=true. The latter is controlled by ELIO_CORE_UI_AUTH_ENABLED and remains false by default. No production environment was changed. This extra opt-in is necessary while legacy password compatibility, private module hydration and full acceptance remain incomplete; it is not permission to deploy.

In opted-in previews, the adapter uses HttpOnly server sessions through the core client, keeps the current user in memory, ignores local admin/password shortcuts, blocks local role changes, and routes the existing Google account buttons to verified server OAuth. The clicked email is never identity proof. Client-side admin-name/email checks resolve only against the current server role. Unsupported legacy account operations fail explicitly instead of mutating server accounts locally. Configuration/restore failure fails closed. The old local account store is not deleted or migrated by this binding.

Unit tests exercise the binding and existing backend contracts. Browser CI additionally exercises the existing form controls with isolated server fixtures, forged LocalStorage admin data and a Google destination fixture. No live account/password/token is used. Snapshot comparisons cover disabled-preview presentation against the immutable pre-binding branch SHA; activated-preview controls are functionally tested, not claimed visually identical with different account data.

Remaining: actual credentials/callback acceptance, original salted legacy password algorithm, per-module private data hydration/edits, password reset and account linking UI, full activated-preview visual acceptance. Keep preview flag off until these are resolved.

Google callback failures now clear the flow cookie and return to the existing login view with an allowlisted error code, rather than stranding the user on a JSON response. The existing error area displays the localized message; no new control/layout is introduced and no provider token/error body enters the redirect.

Browser fixtures also cover a confirmed vocabulary review and a failed save: successful reviews finish only after server confirmation, failed saves retain the card, and neither path writes vocabulary progress into LocalStorage.
