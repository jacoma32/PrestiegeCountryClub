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
import { brandedGear } from './catalog.js';

async function developer(request: Request, input: Record<string, unknown>) {
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if(!token)return reply({message:'Sign in first.'},401);
  const {data,error}=await admin.auth.getUser(token);
  if(error||!data.user)return reply({message:'Sign in again.'},401);
  const {data: claims,error: claimError}=await admin.auth.getClaims(token);
  const session=claims?.claims?.session_id;
  if(claimError||typeof session!=='string')return reply({message:'Sign in again.'},401);
  const owner=data.user.id;
  return sql.begin(async tx=>{
    const [settings]=await tx`select failures,retry_at from pcc_admin.settings where owner_id=${owner} for update`;
    if(!settings)return reply({message:'Developer mode is unavailable for this account.'},403);
    const [unlock]=await tx`select expires_at from pcc_admin.unlocks where session_id=${session} and expires_at>now()`;
    if(input.operation==='developer-status')return reply({enabled:!!unlock});
    if(input.operation==='developer-disable'){
      await tx`delete from pcc_admin.unlocks where session_id=${session}`;
      return reply({enabled:false});
    }
    if(input.operation==='developer-enable'){
      if(settings.retry_at && new Date(settings.retry_at).getTime()>Date.now())return reply({message:'Too many attempts. Wait 15 minutes.'},429);
      const pin=typeof input.pin==='string'&&/^\d{4}$/.test(input.pin)?input.pin:'invalid';
      const [check]=await tx`select pin_hash=extensions.crypt(${pin},pin_hash) as valid from pcc_admin.settings where owner_id=${owner}`;
      if(!check.valid){
        const failures=settings.failures+1;
        await tx`update pcc_admin.settings set failures=${failures>=5?0:failures},retry_at=case when ${failures}>=5 then now()+interval '15 minutes' else null end where owner_id=${owner}`;
        return reply({message:'Incorrect PIN.'},403);
      }
      await tx`update pcc_admin.settings set failures=0,retry_at=null where owner_id=${owner}`;
      await tx`delete from pcc_admin.unlocks where expires_at<=now()`;
      await tx`insert into pcc_admin.unlocks values (${session},now()+interval '30 minutes') on conflict(session_id) do update set expires_at=excluded.expires_at`;
      return reply({enabled:true});
    }
    if(input.operation!=='developer-gift'||!unlock)return reply({message:'Turn on Developer mode first.'},403);
    const username=typeof input.username==='string'?input.username.trim().toLowerCase():'';
    const coins=input.coins;
    const item=brandedGear.find(entry=>entry.id===input.item);
    if(!/^[a-z0-9_]{3,20}$/.test(username)||typeof input.id!=='string'||!/^[a-f0-9-]{36}$/i.test(input.id)||
       (input.kind==='coins'?typeof coins!=='number'||!Number.isInteger(coins)||coins<1||coins>100000:input.kind!=='item'||!item)){
      return reply({message:'Enter a valid username and gift.'},400);
    }
    const [recipient]=await tx`select id from auth.users where email=${username+'@players.prestige.invalid'}`;
    if(!recipient)return reply({message:'Invalid username.'},404);
    await tx`insert into public.player_saves(user_id) values (${recipient.id}) on conflict do nothing`;
    const [save]=await tx`select state from public.player_saves where user_id=${recipient.id} for update`;
    const [prior]=await tx`select id from pcc_admin.gifts where id=${input.id}`;
    if(prior)return reply({message:'Gift already sent.'});
    const state=save.state;
    const wallet=state.wallet??={credits:0,owned:[],equipped:{},rounds:{}};
    if(input.kind==='coins')wallet.credits+=coins;
    else if(wallet.owned.includes(item!.id))return reply({message:'That player already owns this item.'},409);
    else wallet.owned.push(item!.id);
    await tx`update public.player_saves set state=${tx.json(state)},revision=revision+1 where user_id=${recipient.id}`;
    await tx`insert into pcc_admin.gifts(id,sender,recipient,coins,item) values (${input.id},${owner},${recipient.id},${input.kind==='coins'?coins as number:null},${input.kind==='item'?item!.id:null})`;
    return reply({message:'Gift sent to @'+username+'.'});
  });
}

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
    if (typeof input.operation==='string'&&input.operation.startsWith('developer-'))return await developer(request,input);
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
