import { createClient } from 'npm:@supabase/supabase-js@2';
import postgres from 'npm:postgres@3.4.7';
const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, {
  max: 1, prepare: false, connect_timeout: 8, idle_timeout: 10,
});
const origin = 'https://jacoma32.github.io';
const headers = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const reply = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
const projectUrl = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(projectUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST' || request.headers.get('origin') !== origin ||
      request.headers.get('apikey') !== 'sb_publishable_I_T71j3hS2e9kZQ7jbLgfQ_RNuCXyQ5') {
    return reply({ message: 'Request not allowed.' }, 403);
  }
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > 262144) return reply({ message: 'Save is too large.' }, 413);
    const input = JSON.parse(body);
    if (input.operation === 'load' || input.operation === 'save') {
      const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
      if (!token) return reply({ message: 'Sign in first.' }, 401);
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user?.user_metadata?.username) return reply({ message: 'Sign in first.' }, 401);
      const userId = data.user.id;
      if (input.operation === 'load') {
        await sql`insert into public.player_saves (user_id) values (${userId}) on conflict do nothing`;
        const [row] = await sql`select revision, state from public.player_saves where user_id = ${userId}`;
        return reply(row);
      }
      if (!Number.isSafeInteger(input.revision) || input.revision < 0 ||
          !input.state || typeof input.state !== 'object' || Array.isArray(input.state)) {
        return reply({ message: 'Invalid save.' }, 400);
      }
      const [row] = await sql`update public.player_saves set state = ${sql.json(input.state)},
        revision = revision + 1 where user_id = ${userId} and revision = ${input.revision}
        returning revision, state`;
      return row ? reply(row) : reply({ message: 'Save changed.' }, 409);
    }
    const { username, password } = input;
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username) ||
        typeof password !== 'string' || password.length < 6 || new TextEncoder().encode(password).length > 72) {
      return reply({ message: 'Use a 3–20 character username and a password of at least 6 characters (up to 72 bytes).' }, 400);
    }
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const bucket = Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, '0')).join('');
    const [{ allowed }] = await sql`select public.allow_player_registration(${bucket}) as allowed`;
    if (!allowed) return reply({ message: 'Too many signup attempts. Try again later.' }, 429);
    const { error } = await admin.auth.admin.createUser({
      email: username.toLowerCase() + '@players.prestige.invalid',
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error?.code === 'email_exists' || error?.code === 'user_already_exists') return reply({ message: 'That username is taken.' }, 409);
    if (error?.code === 'weak_password') return reply({ message: 'Choose a stronger password.' }, 400);
    if (error) return reply({ message: 'Couldn’t create your account. Try again.' }, 503);
    return reply({ ok: true }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ message: 'Invalid signup request.' }, 400);
    console.error('Registration unavailable', (error as { code?: string }).code);
    return reply({ message: 'Signup is temporarily unavailable.' }, 503);
  }
});
