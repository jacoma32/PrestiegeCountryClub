import { readPreferences, savePreferences } from './preferences.js?v=developer1';

const byId = id => document.getElementById(id);
const form = byId('passwordForm');
const accountStatus = byId('accountStatus');
const passwordStatus = byId('passwordStatus');
const sound = byId('soundPreference');
const textSize = byId('textSize');
const submit = form.querySelector('button');
const preferences = readPreferences();
sound.checked = preferences.sound;
textSize.value = preferences.textSize;

function save(changes) {
  byId('preferencesStatus').textContent = savePreferences(changes)
    ? 'Settings saved.'
    : 'This browser couldn’t save your settings.';
}
sound.addEventListener('change', () => save({ sound: sound.checked }));
textSize.addEventListener('change', () => save({ textSize: textSize.value }));

if (new URLSearchParams(location.search).get('from') === 'clubhouse') {
  const back = byId('backLink');
  back.href = './game.html';
  back.textContent = '← Clubhouse';
}

const passwordErrors = {
  invalid_credentials: 'The current password is incorrect.',
  current_password_mismatch: 'The current password is incorrect.',
  same_password: 'Choose a password different from your current one.',
  weak_password: 'Choose a stronger password with at least 6 characters.',
  over_request_rate_limit: 'Too many attempts. Try again in a moment.',
  session_not_found: 'Sign in again to change your password.',
};

import('./member-auth.js?v=developer1').then(({ auth, changePassword }) => {
  auth.onAuthStateChange((_event, session) => {
    form.hidden = !session?.user.email;
    accountStatus.hidden = !form.hidden;
    accountStatus.textContent = 'Sign in on the homepage to change your password.';
    if (form.hidden) form.reset();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || form.hidden) return;
    const fields = new FormData(form);
    const currentPassword = fields.get('currentPassword');
    const newPassword = fields.get('newPassword');
    if (newPassword !== fields.get('confirmPassword')) {
      passwordStatus.textContent = 'The new passwords don’t match.';
      form.elements.confirmPassword.focus();
      return;
    }
    submit.disabled = true;
    passwordStatus.textContent = '';
    try {
      await changePassword(currentPassword, newPassword);
      form.reset();
      passwordStatus.textContent = 'Password changed.';
    } catch (error) {
      form.elements.currentPassword.value = '';
      passwordStatus.textContent = passwordErrors[error.code]
        || 'Couldn’t change your password. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
}).catch(() => {
  accountStatus.textContent = 'Sign-in is temporarily unavailable. Try again later.';
});

for(const [id,key] of [['minimapPreference','minimap'],['gridPreference','puttingGrid']]){
  const option=byId(id);
  option.checked=preferences[key];
  option.addEventListener('change',()=>save({[key]:option.checked}));
}

import('./member-auth.js?v=developer1').then(async ({auth,developerRequest})=>{
  const panel=byId('developerSettings');
  const {data}=await auth.getSession();
  if(data.session?.user.email!=='bogeyboy@players.prestige.invalid')return;
  const initial=await developerRequest('status');
  const {brandedGear}=await import('./pro-shop-catalog.js?v=developer1');
  const unlock=byId('developerUnlock'),gift=byId('developerGift');
  const actions=byId('developerActions'),status=byId('developerStatus');
  const off=byId('developerOff');
  let busy=false;
  function show(enabled){
    unlock.hidden=enabled;
    actions.hidden=!enabled;
  }
  show(initial.enabled);
  panel.hidden=false;
  auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){panel.hidden=true;show(false);}});
  gift.elements.item.replaceChildren(...brandedGear.map(item=>new Option(item.brand+' '+item.name,item.id)));
  gift.elements.kind.onchange=()=>{
    const coins=gift.elements.kind.value==='coins';
    byId('giftCoins').hidden=gift.elements.coins.disabled=!coins;
    byId('giftItem').hidden=gift.elements.item.disabled=coins;
  };
  async function run(button,action){
    if(busy)return;
    busy=button.disabled=true;
    status.textContent='';
    try{await action()}catch(error){
      status.textContent=error.message;
      if(error.status===403&&button!==unlock.querySelector('button[type=submit]'))show(false);
    }finally{busy=button.disabled=false}
  }
  unlock.onsubmit=event=>{
    event.preventDefault();
    run(event.submitter,async()=>{
      const pin=byId('developerPin').value;
      unlock.reset();
      show((await developerRequest('enable',{pin})).enabled);
      status.textContent='Developer mode is on for 30 minutes.';
    });
  };
  off.onclick=()=>run(off,async()=>{await developerRequest('disable');show(false);status.textContent='Developer mode is off.';});
  let pendingGift;
  gift.onsubmit=event=>{
    event.preventDefault();
    run(event.submitter,async()=>{
      const fields=new FormData(gift);
      const payload={username:fields.get('username'),kind:fields.get('kind'),coins:Number(fields.get('coins')),item:fields.get('item')};
      const key=JSON.stringify(payload);
      if(pendingGift?.key!==key)pendingGift={key,id:crypto.randomUUID()};
      const result=await developerRequest('gift',{...payload,id:pendingGift.id});
      pendingGift=null;
      status.textContent=result.message;
    });
  };
}).catch(()=>{});
