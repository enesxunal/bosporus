/* 3 Kare Ajans agency signature; language follows the displayed page. */
(function () {
  'use strict';
  const words = {
    tr: ['TASARIM & GELİŞTİRME', 'İyi fikirler,', 'iz bırakır.'],
    de: ['DESIGN & ENTWICKLUNG', 'Gute Ideen', 'hinterlassen Spuren.'],
    en: ['DESIGN & DEVELOPMENT', 'Good ideas', 'leave a mark.'],
    pl: ['PROJEKTOWANIE I ROZWÓJ', 'Dobre pomysły', 'zostawiają ślad.'],
    ru: ['ДИЗАЙН И РАЗРАБОТКА', 'Хорошие идеи', 'оставляют след.'],
    ka: ['დიზაინი და განვითარება', 'კარგი იდეები', 'კვალს ტოვებს.']
  };
  function currentLanguage() {
    const raw = (document.documentElement.getAttribute('lang') || '').toLowerCase().split('-')[0];
    const prefix = location.pathname.split('/')[1].toLowerCase();
    if (raw === 'pl' && ['en', 'tr', 'pl'].includes(prefix)) return prefix;
    return words[raw] ? raw : words[prefix] ? prefix : 'tr';
  }
  function ensureStyles() {
    if (document.querySelector('link[data-kare-signature-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/3kare/signature.css';
    link.dataset.kareSignatureCss = '';
    document.head.appendChild(link);
  }
  function update() {
    const lang = currentLanguage();
    const [label, lead, end] = words[lang];
    document.querySelectorAll('[data-kare-signature]').forEach(el => {
      const fields = [el.querySelector('[data-kare-label]'), el.querySelector('[data-kare-lead]'), el.querySelector('[data-kare-end]')];
      for (const [i, field] of fields.entries()) if (field && field.textContent !== [label, lead, end][i]) field.textContent = [label, lead, end][i];
      el.setAttribute('lang', lang);
    });
  }
  function mount() {
    ensureStyles();
    const footers = document.querySelectorAll('footer:not([data-kare-standalone])');
    const footer = footers.length ? footers[footers.length - 1] : null;
    if (!footer) return;
    if (!footer.querySelector('[data-kare-signature]')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'kare-agency-signature';
      wrapper.setAttribute('data-kare-signature', '');
      wrapper.innerHTML = '<div class="kare-agency-signature__text"><span data-kare-label></span><p><span data-kare-lead></span> <strong data-kare-end></strong></p></div><a class="kare-agency-signature__credit" href="https://3kareajans.com/" target="_blank" rel="noopener noreferrer" aria-label="3 Kare Ajans"><img src="/3kare/logo.png" alt="3 Kare Ajans" width="150" height="52" loading="lazy"><span>3kareajans.com ↗</span></a>';
      footer.appendChild(wrapper);
    }
    update();
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mount(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  window.addEventListener('load', schedule, { once: true });
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  function watchBody() { if (document.body) observer.observe(document.body, {childList: true, subtree: true}); }
  if (document.body) watchBody(); else document.addEventListener('DOMContentLoaded', watchBody, {once:true});
})();
