// Cloudflare Worker — GitHub OAuth for NixTv admin.
// Secrets: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET (32+ random chars)
// Vars: PUBLIC_ORIGIN (https://nixtv-oficial.github.io), ADMIN_GITHUB_LOGIN (GitHub username)
// Configure worker route URL in admin/auth-config.js as AUTH_API.
const encoder=new TextEncoder();
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
async function hmacKey(secret){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function sign(payload,secret){const p=b64(encoder.encode(JSON.stringify(payload)));const sig=b64(await crypto.subtle.sign('HMAC',await hmacKey(secret),encoder.encode(p)));return p+'.'+sig;}
async function verify(value,secret){if(!value)return null;const [p,s]=value.split('.');if(!p||!s)return null;const ok=await crypto.subtle.verify('HMAC',await hmacKey(secret),unb64(s),encoder.encode(p));if(!ok)return null;const obj=JSON.parse(new TextDecoder().decode(unb64(p)));return obj.exp>Date.now()?obj:null;}
const cookie=(name,val,age)=>name+'='+val+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+age;
const json=(obj,status=200,extra={})=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...extra}});
function cors(req,env){const origin=req.headers.get('Origin');return origin===env.PUBLIC_ORIGIN?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Vary':'Origin'}:{};}
function redirect(url,cookies=[]){const h=new Headers({'Location':url,'Cache-Control':'no-store'});cookies.forEach(c=>h.append('Set-Cookie',c));return new Response(null,{status:302,headers:h});}
export default {async fetch(req,env){
 const url=new URL(req.url),base=url.origin,origin=env.PUBLIC_ORIGIN;
 if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET||!env.SESSION_SECRET||!env.ADMIN_GITHUB_LOGIN||!origin)return json({error:'Worker não configurado'},503);
 if(req.method==='OPTIONS')return new Response(null,{headers:{...cors(req,env),'Access-Control-Allow-Methods':'GET,PUT,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
 if(url.pathname==='/login'){
   const state=crypto.randomUUID();const oauth=new URL('https://github.com/login/oauth/authorize');
   oauth.searchParams.set('client_id',env.GITHUB_CLIENT_ID);oauth.searchParams.set('redirect_uri',base+'/callback');
   oauth.searchParams.set('scope','repo');oauth.searchParams.set('state',state);
   return redirect(oauth.href,[cookie('nix_state',await sign({state,exp:Date.now()+600000},env.SESSION_SECRET),600)]);
 }
 if(url.pathname==='/callback'){
   const cookies=Object.fromEntries((req.headers.get('Cookie')||'').split(';').map(x=>x.trim().split('=')));
   const st=await verify(cookies.nix_state,env.SESSION_SECRET);
   if(!st||st.state!==url.searchParams.get('state'))return json({error:'Estado OAuth inválido'},403);
   const response=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:base+'/callback'})});
   const data=await response.json();if(!data.access_token)return json({error:'Falha no login OAuth'},401);
   const gh=await fetch('https://api.github.com/user',{headers:{'Authorization':'Bearer '+data.access_token,'Accept':'application/vnd.github+json','User-Agent':'NixTv-admin'}});
   const user=await gh.json();if(!gh.ok||user.login?.toLowerCase()!==env.ADMIN_GITHUB_LOGIN.toLowerCase())return json({error:'Usuário GitHub não autorizado'},403);
   // Session stores an encrypted GitHub OAuth access token; never expose it to the browser.
   const key=await crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',encoder.encode(env.SESSION_SECRET)),'AES-GCM',false,['encrypt','decrypt']);
   const iv=crypto.getRandomValues(new Uint8Array(12));
   const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(JSON.stringify({token:data.access_token,exp:Date.now()+3600000})));
   const session=b64(iv)+'.'+b64(cipher);
   return redirect(origin+'/admin/',[cookie('nix_state','',0),cookie('nix_session',session,3600)]);
 }
 const headers=cors(req,env);
 if(req.headers.get('Origin')!==origin)return json({error:'Origem não autorizada'},403,headers);
 const cookies=Object.fromEntries((req.headers.get('Cookie')||'').split(';').map(x=>x.trim().split('=')));
 let token;
 try{
   const [i,c]=(cookies.nix_session||'').split('.');
   const key=await crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',encoder.encode(env.SESSION_SECRET)),'AES-GCM',false,['decrypt']);
   const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(i)},key,unb64(c));
   const session=JSON.parse(new TextDecoder().decode(clear));if(session.exp<=Date.now())throw Error('Expired');token=session.token;
 }catch{return json({error:'Faça login com GitHub'},401,headers);}
 if(url.pathname==='/logout'&&req.method==='POST')return json({ok:true},200,{...headers,'Set-Cookie':cookie('nix_session','',0)});
 if(url.pathname==='/config'&&['GET','PUT'].includes(req.method)){
   const target='https://api.github.com/repos/NixTv-Oficial/nixtv-oficial.github.io/contents/site-config.js';
   const ghHeaders={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'NixTv-admin','X-GitHub-Api-Version':'2022-11-28'};
   if(req.method==='GET'){
     const r=await fetch(target,{headers:ghHeaders});return json(await r.json(),r.status,headers);
   }
   const body=await req.json();
   if(typeof body.sha!=='string'||typeof body.content!=='string'||body.content.length>200000)return json({error:'Dados inválidos'},400,headers);
   const r=await fetch(target,{method:'PUT',headers:{...ghHeaders,'Content-Type':'application/json'},body:JSON.stringify({message:'Atualizar configurações pelo painel NixTv',sha:body.sha,content:body.content,branch:'main'})});
   return json(await r.json(),r.status,headers);
 }
 return json({error:'Rota não encontrada'},404,headers);
}};
