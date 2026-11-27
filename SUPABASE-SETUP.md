# Supabase player accounts

The homepage accepts a username and password. Supabase Auth manages the password and session. An internal address ending in `@players.prestige.invalid` maps each lowercase username to a Supabase Auth account. Players never enter an email address, and registration sends no messages. Password changes require the current password. There is no email reset.

Apply the migration in `supabase/migrations` and deploy `register-player` from `supabase/functions`. The function admits public registration requests from the production site's browser origin and rate-limits them. Save requests require a valid Supabase user session. The function uses its built-in server secrets. The website only contains the project's publishable key.

Account saves include coins, locker ownership, equipped gear and golfer appearance. Guest progress stays in its original browser. The existing Friends and multiplayer service is configured separately.
