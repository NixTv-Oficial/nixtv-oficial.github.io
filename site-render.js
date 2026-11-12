(function () {
  const c = window.NIX_CONFIG;
  if (!c) return;
  function update() {
    const annual = document.getElementById('btnAnual')?.classList.contains('bg-purple-600');
    for (const [name, id] of [['solo','Solo'],['duo','Duo'],['familia','Familia']]) {
      const el = document.getElementById('preco' + id);
      if (el) el.textContent = String(c.prices[name][annual ? 'annual' : 'monthly']);
    }
    document.querySelectorAll('a[href*="wa.me/5571997108320"]').forEach(a => {
      a.href = a.href.replace('5571997108320', c.whatsapp);
    });
    const wrap = document.getElementById('siteBanners');
    if (!wrap) return;
    wrap.replaceChildren();
    (c.banners || []).filter(b => b.active && b.image).forEach(b => {
      const section = document.createElement('div');
      section.className = 'mb-4 overflow-hidden rounded-2xl border border-cyan-500/30 bg-nixcard';
      const img = document.createElement('img');
      img.src = b.image;
      img.alt = b.title || 'Promoção NixTv';
      img.loading = 'lazy';
      img.className = 'w-full max-h-80 object-cover';
      section.append(img);
      if (b.title) {
        const p = document.createElement('p');
        p.className = 'p-4 text-center font-bold';
        p.textContent = b.title;
        section.append(p);
      }
      wrap.append(section);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update);
  else update();
})();
