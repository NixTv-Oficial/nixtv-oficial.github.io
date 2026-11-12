(function(){
 const c=window.NIX_CONFIG;if(!c)return;
 function init(){
   const annual=document.getElementById('btnAnual')?.classList.contains('bg-purple-600');
   for(const [name,id] of [['solo','Solo'],['duo','Duo'],['familia','Familia']]){
     const el=document.getElementById('preco'+id);if(el&&c.prices?.[name])el.textContent=String(c.prices[name][annual?'annual':'monthly']);
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
   if(movies){movies.replaceChildren();const entries=(c.movies||[]).filter(x=>x.active&&x.image&&x.title);const section=document.getElementById('moviesSection');if(section)section.hidden=!entries.length||settings.showMovies===false;
     const heading=document.getElementById('moviesHeading');if(heading)heading.textContent=settings.moviesTitle||'Filmes e séries em destaque';
     const description=document.getElementById('moviesDescription');if(description)description.textContent=settings.moviesDescription||'Confira algumas novidades selecionadas pela NixTv.';
     entries.forEach(m=>{const card=document.createElement('article');card.className='min-w-0 overflow-hidden rounded-xl bg-slate-900 border border-white/10';
       const img=document.createElement('img');img.src=m.image;img.alt='Capa: '+m.title;img.loading='lazy';img.decoding='async';img.className='w-full aspect-[2/3] object-cover';
       const title=document.createElement('p');title.textContent=m.title;title.className='p-2 sm:p-3 text-xs sm:text-sm font-semibold text-center line-clamp-2';card.append(img,title);movies.append(card);
     });
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
