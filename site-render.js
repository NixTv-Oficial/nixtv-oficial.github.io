(function(){
 let c=window.NIX_CONFIG;if(!c)return;
 const formatarPreco=v=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
 function init(){
   const annual=document.getElementById('btnAnual')?.classList.contains('bg-purple-600');
   const money=v=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
   const now=Date.now();
   for(const [name,id] of [['solo','Solo'],['duo','Duo'],['familia','Familia']]){
     const el=document.getElementById('preco'+id);
     const plan=c.planDetails?.[name]||{};
     for(const [key,value] of [['planName',plan.name],['planScreens',plan.screens],['planDevices',plan.devices]]){
       const node=document.getElementById(key+id);if(node&&value)node.textContent=value;
     }
     const base=Number(c.prices?.[name]?.[annual?'annual':'monthly']);
     const promo=c.promotions?.[name];
     const start=promo?.start?Date.parse(promo.start+'T00:00:00'):0;
     const end=promo?.end?Date.parse(promo.end+'T23:59:59'):Infinity;
     const eligible=promo?.active&&(!promo.period||promo.period===(annual?'annual':'monthly'))&&now>=start&&now<=end&&Number(promo.price)>=0&&Number(promo.price)<base;
     if(el&&Number.isFinite(base))el.textContent=money(eligible?promo.price:base);
     const label=document.getElementById('promo'+id);
     if(label){label.classList.toggle('hidden',!eligible);label.textContent=eligible?'De R$ '+money(base)+' por':'';}

   }
   document.querySelectorAll('a[href*="wa.me/"]').forEach(a=>{
     try{const u=new URL(a.href);if(u.hostname==='wa.me'){u.pathname='/'+c.whatsapp;a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';}}catch{}
   });
   const settings=c.settings||{};
   const banners=document.getElementById('siteBanners');
   if(banners){banners.hidden=settings.showBanners===false;banners.replaceChildren();(c.banners||[]).filter(x=>x.active&&x.image).forEach(b=>{
     const box=document.createElement('div');box.className='mb-4 overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900';
     const img=document.createElement('img');img.src=b.image;img.alt=b.title||'Banner NixTv';img.loading='lazy';img.decoding='async';img.className='w-full h-auto max-h-64 sm:max-h-80 object-cover';box.append(img);
     if(b.title){const p=document.createElement('p');p.className='p-3 sm:p-4 text-center font-bold text-sm sm:text-base';p.textContent=b.title;box.append(p);}
     banners.append(box);
   });}
   const movies=document.getElementById('siteMovies');
   if(movies){movies.replaceChildren();const entries=(c.movies||[]).filter(x=>x.active&&x.image&&x.title).sort((a,b)=>(b.date||'').localeCompare(a.date||''));const section=document.getElementById('moviesSection');if(section)section.hidden=!entries.length||settings.showMovies===false;
     const heading=document.getElementById('moviesHeading');if(heading)heading.textContent=settings.moviesTitle||'Filmes e séries em destaque';
     const description=document.getElementById('moviesDescription');if(description)description.textContent=settings.moviesDescription||'Confira algumas novidades selecionadas pela NixTv.';
     const selected=movies.dataset.filter||'Todos';
     document.querySelectorAll('[data-movie-filter]').forEach(btn=>{btn.onclick=()=>{movies.dataset.filter=btn.dataset.movieFilter;init();};btn.classList.toggle('bg-cyan-700',btn.dataset.movieFilter===selected);btn.classList.toggle('bg-slate-800',btn.dataset.movieFilter!==selected);});
     entries.filter(m=>selected==='Todos'||(m.category||'Filme')===selected).forEach(m=>{const card=document.createElement('article');card.className='min-w-0 overflow-hidden rounded-xl bg-slate-900 border border-white/10';
       const img=document.createElement('img');img.src=m.image;img.alt='Capa: '+m.title;img.loading='lazy';img.decoding='async';img.className='w-full aspect-[2/3] object-cover';
       const title=document.createElement('p');title.textContent=m.title;title.className='p-2 sm:p-3 text-xs sm:text-sm font-semibold text-center line-clamp-2';card.append(img,title);const meta=document.createElement('p');meta.className='text-center text-[10px] text-slate-400 pb-2';meta.textContent=(m.category||'Filme')+(m.date?' · '+m.date.split('-').reverse().join('/'):'');card.append(meta);movies.append(card);
     });
   }
 }
 window.addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='NIX_ADMIN_PREVIEW')return;
   if(!location.pathname.endsWith('/')&&!location.pathname.endsWith('/index.html'))return;
   const next=event.data.config;
   if(!next||typeof next!=='object'||!next.prices||!Array.isArray(next.banners))return;
   c=next;window.NIX_CONFIG=next;init();
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
