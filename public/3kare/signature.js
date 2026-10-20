/* 3 Kare Ajans: Elmas Triko signature for localized, responsive footers. */
(function () {
  'use strict';
  const translations = {
    tr: ['TASARIM & GELİŞTİRME', 'İyi fikirler,', 'iz bırakır.'],
    de: ['DESIGN & ENTWICKLUNG', 'Gute Ideen', 'hinterlassen Spuren.'],
    en: ['DESIGN & DEVELOPMENT', 'Good ideas', 'leave a mark.'],
    pl: ['PROJEKTOWANIE I ROZWÓJ', 'Dobre pomysły', 'zostawiają ślad.'],
    ru: ['ДИЗАЙН И РАЗРАБОТКА', 'Хорошие идеи', 'оставляют след.'],
    ka: ['დიზაინი და განვითარება', 'კარგი იდეები', 'კვალს ტოვებს.']
  };
  const script = document.currentScript || document.querySelector('script[src*="3kare/"][src*="signature.js"]');
  const root = new URL('.', script && script.src ? script.src : location.origin + '/3kare/signature.js');
  const asset = (name) => new URL(name + '?v=elmas-v2', root).href;
  const language = () => {
    const html = (document.documentElement.lang || '').toLowerCase().split('-')[0];
    const path = location.pathname.split('/')[1].toLowerCase();
    return translations[html] ? html : translations[path] ? path : 'tr';
  };
  function styles() {
    if (document.querySelector('link[data-kare-signature-css]')) return;
    const node = document.createElement('link');
    node.rel = 'stylesheet';
    node.href = asset('signature.css');
    node.dataset.kareSignatureCss = '';
    document.head.append(node);
  }
  function background(el) {
    for (let current = el; current; current = current.parentElement) {
      const css = getComputedStyle(current);
      const match = css.backgroundColor.match(/^rgba?\(([^)]+)\)/);
      if (!match) continue;
      const values = match[1].split(/[,\s/]+/).map(Number);
      if (values.length >= 4 && values[3] < .5) continue;
      const [r, g, b] = values;
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return .2126 * r + .7152 * g + .0722 * b < 136 ? 'dark' : 'light';
      }
    }
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function build() {
    const wrapper = document.createElement('div');
    wrapper.className = 'kare-agency-signature';
    wrapper.dataset.kareSignature = '';
    wrapper.innerHTML =
      '<div class="kare-agency-signature__text">' +
      '<span class="kare-agency-signature__eyebrow"><span class="kare-agency-signature__squares" aria-hidden="true"><i></i><i></i><i></i></span><span data-kare-label></span></span>' +
      '<p><span data-kare-lead></span> <strong data-kare-end></strong></p></div>' +
      '<a class="kare-agency-signature__credit" href="https://3kareajans.com/" target="_blank" rel="noopener noreferrer" aria-label="3 Kare Ajans">' +
      '<span class="kare-agency-signature__brand"><img width="96" height="30" loading="lazy" alt="3 Kare Ajans" src="' + asset('logo.png') + '"><span class="kare-agency-signature__domain">3kareajans.com</span></span>' +
      '<span class="kare-agency-signature__arrow">' + arrow + '</span></a>';
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      wrapper.dataset.kareEnter = 'true';
      const observer = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
          wrapper.dataset.kareVisible = 'true';
          observer.disconnect();
        }
      }, { threshold: .1 });
      observer.observe(wrapper);
    } else {
      wrapper.dataset.kareVisible = 'true';
    }
    return wrapper;
  }
  function refresh() {
    styles();
    const footers = document.querySelectorAll('footer:not([data-kare-standalone])');
    const footer = footers.length ? footers[footers.length - 1] : null;
    if (!footer) return;
    let wrapper = footer.querySelector('[data-kare-signature]');
    if (!wrapper) {
      wrapper = build();
      const onlyChild = footer.children.length === 1 ? footer.firstElementChild : null;
      const host = onlyChild && (onlyChild.tagName === 'DIV' || onlyChild.tagName === 'SECTION') ? onlyChild : footer;
      host.appendChild(wrapper);
    }
    const siteLang = language();
    const [label, lead, end] = translations[siteLang];
    const values = [['[data-kare-label]', label], ['[data-kare-lead]', lead], ['[data-kare-end]', end]];
    values.forEach(([selector, value]) => {
      const el = wrapper.querySelector(selector);
      if (el && el.textContent !== value) el.textContent = value;
    });
    if (wrapper.lang !== siteLang) wrapper.lang = siteLang;
    const theme = background(footer);
    if (wrapper.dataset.theme !== theme) wrapper.dataset.theme = theme;
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  window.addEventListener('load', schedule, { once: true });
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'class'] });
  const watchBody = () => { if (document.body) observer.observe(document.body, { childList: true, subtree: true }); };
  if (document.body) watchBody(); else document.addEventListener('DOMContentLoaded', watchBody, { once: true });
})();
