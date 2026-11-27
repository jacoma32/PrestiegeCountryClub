# Homepage sign-in with Supabase

The homepage uses Supabase Auth for email accounts and Google sign-in. It connects using the public project URL and publishable key in `js/member-auth.js`.

1. In Supabase, open **Authentication → URL Configuration**. Set the Site URL to `https://jacoma32.github.io/PrestiegeCountryClub/` and add that exact URL to **Redirect URLs**.
2. Keep the **Email** provider and email confirmations enabled. For public email sign-ups, configure a custom SMTP provider under **Authentication → SMTP Settings**. Supabase's default mail service only sends to authorized project team addresses.
3. For **Sign in with Google**, configure the Google provider under **Authentication → Sign In / Providers**. Add the callback URL shown there to the allowed redirect URIs in Google Cloud. Save the Google client ID and client secret in Supabase.
4. Verify sign-up, the email confirmation link, sign-in, sign-out, and Google sign-in on GitHub Pages.

Keep secret keys and the database password out of GitHub. Supabase Auth uses its own API, so homepage sign-in works with the Data API disabled. In-game Friends uses its existing service and browser identity.
