# BeTacora — Confirm signup email (Supabase)

Paste the HTML from `supabase/templates/confirm-signup.html` into the Supabase Dashboard.

## Where to paste it

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **Authentication** → **Emails** (sometimes labeled **Email Templates**)
3. Select the **Confirm signup** template
4. Set:
   - **Subject:** `Confirma tu email — BeTacora`
   - **Body:** replace the entire default HTML with the contents of `supabase/templates/confirm-signup.html`
5. Click **Save**

Path in the UI (typical):

`Project → Authentication → Emails → Templates → Confirm signup`

## URL Configuration (required)

**Authentication → URL Configuration** — double-check these are **not** localhost or a Vercel preview URL:

| Setting | Value |
|---------|--------|
| **Site URL** | `https://www.beta-cora.com` |
| **Redirect URLs** | see list below |

Add (or keep) these **Redirect URLs**:

```
https://www.beta-cora.com/**
https://beta-cora.com/**
http://localhost:3000/**
```

The app sends confirmation links to:

`https://www.beta-cora.com/auth/callback?confirmed=1&next=/inicio`

That path must be allowed (the `/**` wildcards cover it). After the user clicks the email link in the same tab, they see **¡Cuenta confirmada!** and are redirected to `/inicio` while signed in.

## Important notes

- Keep the Go template variables as-is: `{{ .ConfirmationURL }}` and `{{ .SiteURL }}`. Supabase injects them when sending. `ConfirmationURL` uses Site URL + the `emailRedirectTo` from sign-up/resend.
- This is a **transactional** auth email. There is no marketing unsubscribe link; the footer explains that ignoring the email is safe if the user did not sign up.
- Optional: open `docs/emails/confirm-signup-preview.html` in a browser to preview the layout locally (fake link, not for Supabase).

## Brand tokens used

| Token | Value |
|-------|--------|
| Cream bg | `#FAF8F4` |
| Coral CTA | `#E8634A` |
| Teal | `#2D7B7B` |
| Ink | `#1A1A1A` |
| Muted | `#6B6B6B` |
| Logo | `https://www.beta-cora.com/icon-512.png?v=4` |
