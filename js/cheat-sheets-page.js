// Cheat Sheets page.
// The list of cheat sheets lives in js/cheatsheets.js. You shouldn't need to edit this file to add one.

(function () {
  'use strict';

  const SHEETS = window.CHEATSHEETS || [];
  const CATEGORIES = window.CHEATSHEET_CATEGORIES || [];
  const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const PDF_MAX_WIDTH = 1350; // px per slide in a generated PDF: sharp, but keeps the file small

  const phoneQuery = window.matchMedia('(max-width: 600px)');
  const touchQuery = window.matchMedia('(pointer: coarse)');

  // ---------- Helpers ----------

  function slideSrc(sheet, n) {
    return 'images/cheatsheets/' + sheet.folder + '/' + n + '.png';
  }

  function slidesLabel(count) {
    return count + (count === 1 ? ' slide' : ' slides');
  }

  function findSheet(id) {
    return SHEETS.find(sheet => sheet.id === id);
  }

  function sheetUrl(sheet) {
    return location.href.split('#')[0] + '#' + sheet.id;
  }

  function track(eventName, sheet, extra) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, Object.assign({
      cheatsheet_id: sheet.id,
      cheatsheet_title: sheet.title
    }, extra));
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // ---------- Tabs, search and cards ----------

  const tabsEl = document.querySelector('.cs_tabs');
  const gridEl = document.getElementById('cs_grid');
  const messageEl = document.getElementById('cs_message');
  const searchInput = document.getElementById('cs_search_input');

  let activeCategory = CATEGORIES.length ? CATEGORIES[0].id : null;
  const tabButtons = new Map();
  const cards = new Map();

  CATEGORIES.forEach(category => {
    const button = el('button', 'cs_tab', category.title);
    button.type = 'button';
    button.addEventListener('click', () => {
      searchInput.value = '';
      setCategory(category.id);
    });
    tabButtons.set(category.id, button);
    tabsEl.appendChild(button);
  });

  SHEETS.forEach(sheet => {
    const card = el('a', 'cs_card');
    card.href = '#' + sheet.id;
    card.dataset.id = sheet.id;
    card.setAttribute('aria-label', sheet.title + ', ' + slidesLabel(sheet.slides) + '. Open cheat sheet');

    const cover = el('div', 'cs_card_cover');
    if (sheet.isNew) {
      const badge = el('span', 'cs_badge', 'NEW');
      badge.setAttribute('aria-hidden', 'true');
      cover.appendChild(badge);
    }
    const img = el('img', 'cs_card_img');
    img.src = slideSrc(sheet, 1);
    img.alt = 'Cover of the ' + sheet.title + ' cheat sheet';
    img.loading = 'lazy';
    img.decoding = 'async';
    const markLoaded = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) markLoaded();
    else img.addEventListener('load', markLoaded);
    cover.appendChild(img);

    const info = el('p', 'cs_card_info');
    info.appendChild(el('span', 'cs_card_title', sheet.title));
    info.appendChild(el('span', 'cs_card_count', slidesLabel(sheet.slides)));

    card.append(cover, info);
    card.addEventListener('click', event => {
      // Let Ctrl/Cmd-click open the link in a new tab as usual
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      openViewer(sheet, { fromCard: card });
    });

    cards.set(sheet.id, card);
    gridEl.appendChild(card);
  });

  function setMessage(title, text) {
    messageEl.textContent = '';
    if (!title) {
      messageEl.hidden = true;
      return;
    }
    messageEl.appendChild(el('strong', '', title));
    messageEl.appendChild(document.createTextNode(text));
    messageEl.hidden = false;
  }

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;

    SHEETS.forEach(sheet => {
      const match = query
        ? sheet.title.toLowerCase().includes(query)
        : sheet.category === activeCategory;
      cards.get(sheet.id).hidden = !match;
      if (match) visible++;
    });

    tabButtons.forEach((button, id) => {
      button.setAttribute('aria-pressed', String(id === activeCategory));
    });
    tabsEl.classList.toggle('is-searching', Boolean(query));
    gridEl.hidden = visible === 0;

    if (visible > 0) {
      setMessage(null);
    } else if (query) {
      setMessage('Nothing found yet', 'Try another word, or check back soon: new cheat sheets are on the way.');
    } else {
      const category = CATEGORIES.find(c => c.id === activeCategory);
      setMessage('Coming soon', (category ? category.title : 'These') + ' cheat sheets are in the works. Check back soon ✨');
    }
  }

  function setCategory(id) {
    activeCategory = id;
    render();
  }

  searchInput.addEventListener('input', render);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Escape' && searchInput.value) {
      searchInput.value = '';
      render();
    }
  });

  // Shorter placeholder on phones
  const longPlaceholder = searchInput.placeholder;
  function updatePlaceholder() {
    searchInput.placeholder = phoneQuery.matches ? searchInput.dataset.placeholderPhone : longPlaceholder;
  }
  updatePlaceholder();
  phoneQuery.addEventListener('change', updatePlaceholder);

  // ---------- Popup ----------

  const viewer = document.querySelector('.cs_viewer');
  const viewerTitle = document.getElementById('cs_viewer_title');
  const slideImg = viewer.querySelector('.cs_slide');
  const counterEl = viewer.querySelector('.cs_counter');
  const thumbsEl = viewer.querySelector('.cs_thumbs');
  const prevBtn = viewer.querySelector('.cs_arrow_prev');
  const nextBtn = viewer.querySelector('.cs_arrow_next');
  const closeBtn = viewer.querySelector('.cs_close');
  const shareBtn = viewer.querySelector('.cs_share');
  const pdfBtn = viewer.querySelector('.cs_pdf');
  const pdfLabel = viewer.querySelector('.cs_pdf_label');
  const toastEl = viewer.querySelector('.cs_toast');

  let current = null;     // the open cheat sheet
  let index = 0;          // 0-based slide index
  let pushedHistory = false;
  let returnFocusTo = null;

  function showSlide(i) {
    if (!current) return;
    index = Math.max(0, Math.min(current.slides - 1, i));
    const n = index + 1;

    slideImg.classList.add('is-loading');
    slideImg.src = slideSrc(current, n);
    slideImg.alt = current.title + ' cheat sheet, slide ' + n + ' of ' + current.slides;
    counterEl.textContent = n + ' / ' + current.slides;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === current.slides - 1;

    thumbsEl.querySelectorAll('.cs_thumb').forEach((thumb, t) => {
      const active = t === index;
      thumb.setAttribute('aria-current', String(active));
      if (active) thumb.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });

    // Warm up the neighbours so arrows and swipes feel instant
    [n - 1, n + 1].forEach(m => {
      if (m >= 1 && m <= current.slides) new Image().src = slideSrc(current, m);
    });
  }

  slideImg.addEventListener('load', () => slideImg.classList.remove('is-loading'));
  slideImg.addEventListener('error', () => slideImg.classList.remove('is-loading'));

  function buildThumbs(sheet) {
    thumbsEl.textContent = '';
    for (let n = 1; n <= sheet.slides; n++) {
      const thumb = el('button', 'cs_thumb');
      thumb.type = 'button';
      thumb.setAttribute('aria-label', 'Go to slide ' + n);
      const img = el('img');
      img.src = slideSrc(sheet, n);
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      thumb.appendChild(img);
      thumb.addEventListener('click', () => showSlide(n - 1));
      thumbsEl.appendChild(thumb);
    }
  }

  // options.fromCard: the card that was clicked (adds a history entry, so phone "back" closes the popup)
  // options.fromLink: opened from a shared link like cheat-sheets.html#color-match
  function openViewer(sheet, options) {
    options = options || {};
    const alreadyOpen = viewer.open;

    current = sheet;
    viewerTitle.textContent = sheet.title + ' cheat sheet';
    buildThumbs(sheet);
    hideToast();
    showSlide(0);

    if (options.fromCard) {
      returnFocusTo = options.fromCard;
      history.pushState({ cheatsheet: sheet.id }, '', '#' + sheet.id);
      pushedHistory = true;
    } else {
      returnFocusTo = cards.get(sheet.id) || null;
    }

    if (!alreadyOpen) {
      document.documentElement.classList.add('is-locked');
      viewer.showModal();
      closeBtn.focus();
    }

    track('open_cheatsheet', sheet, { source: options.fromLink ? 'link' : 'card' });
  }

  // Fires on ✕, backdrop click, Esc and phone "back"
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('is-locked');
    hideToast();

    if (location.hash) {
      if (pushedHistory && history.state && history.state.cheatsheet) {
        history.back(); // removes the hash entry we added
      } else {
        history.replaceState(null, '', location.pathname + location.search);
      }
    }
    pushedHistory = false;
    current = null;

    if (returnFocusTo && !returnFocusTo.hidden) returnFocusTo.focus({ preventScroll: true });
  });

  closeBtn.addEventListener('click', () => viewer.close());
  prevBtn.addEventListener('click', () => showSlide(index - 1));
  nextBtn.addEventListener('click', () => showSlide(index + 1));

  // Backdrop click (only when the press also started on the backdrop)
  let pressedOnBackdrop = false;
  function isOnBackdrop(event) {
    if (event.target !== viewer) return false;
    const rect = viewer.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
           event.clientY < rect.top || event.clientY > rect.bottom;
  }
  viewer.addEventListener('pointerdown', event => {
    pressedOnBackdrop = isOnBackdrop(event);
  });
  viewer.addEventListener('click', event => {
    if (pressedOnBackdrop && isOnBackdrop(event)) viewer.close();
    pressedOnBackdrop = false;
  });

  // Keyboard arrows
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showSlide(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showSlide(index + 1);
    }
  });

  // Swipe
  const stage = viewer.querySelector('.cs_stage');
  let touchX = null;
  let touchY = null;
  stage.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { touchX = null; return; }
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    const dy = event.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      showSlide(index + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });

  // ---------- Share ----------

  let toastTimer = null;
  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 2200);
  }
  function hideToast() {
    clearTimeout(toastTimer);
    toastEl.classList.remove('is-visible');
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      viewer.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  shareBtn.addEventListener('click', async () => {
    if (!current) return;
    const sheet = current;
    const url = sheetUrl(sheet);

    // Phones: the native share sheet
    if (touchQuery.matches && navigator.share) {
      try {
        await navigator.share({
          title: sheet.title + ' · Free design cheat sheet',
          text: sheet.title + ': a free cheat sheet for designers by Polina Gotsina',
          url: url
        });
        track('share_cheatsheet', sheet, { method: 'native' });
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return; // closed the share sheet
        // anything else: fall back to copying
      }
    }

    try {
      await copyText(url);
      showToast('Link copied!');
      track('share_cheatsheet', sheet, { method: 'copy_link' });
    } catch (error) {
      showToast('Couldn’t copy. The link is in the address bar');
    }
  });

  // ---------- Save PDF ----------

  let jsPdfPromise = null;
  function loadJsPdf() {
    if (window.jspdf) return Promise.resolve(window.jspdf);
    if (!jsPdfPromise) {
      jsPdfPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = JSPDF_URL;
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
        script.onload = () => window.jspdf ? resolve(window.jspdf) : reject(new Error('jsPDF missing'));
        script.onerror = () => { jsPdfPromise = null; reject(new Error('jsPDF failed to load')); };
        document.head.appendChild(script);
      });
    }
    return jsPdfPromise;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not load ' + src));
      img.src = src;
    });
  }

  // Slide -> JPEG at a sensible size (the original PNGs are huge)
  function slideToJpeg(img) {
    const scale = Math.min(1, PDF_MAX_WIDTH / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return { data: canvas.toDataURL('image/jpeg', 0.88), w: w, h: h };
  }

  async function buildPdf(sheet) {
    const lib = await loadJsPdf();
    let doc = null;
    for (let n = 1; n <= sheet.slides; n++) {
      const page = slideToJpeg(await loadImage(slideSrc(sheet, n)));
      const orientation = page.w > page.h ? 'landscape' : 'portrait';
      if (!doc) {
        doc = new lib.jsPDF({ orientation: orientation, unit: 'px', format: [page.w, page.h], hotfixes: ['px_scaling'], compress: true });
        doc.setProperties({ title: sheet.title + ' cheat sheet', author: 'Polina Gotsina' });
      } else {
        doc.addPage([page.w, page.h], orientation);
      }
      doc.addImage(page.data, 'JPEG', 0, 0, page.w, page.h);
    }
    doc.save(sheet.id + '-cheat-sheet.pdf');
  }

  function downloadFile(href, name) {
    const link = document.createElement('a');
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  pdfBtn.addEventListener('click', async () => {
    if (!current || pdfBtn.disabled) return;
    const sheet = current;

    if (sheet.pdf) {
      downloadFile('images/cheatsheets/' + sheet.folder + '/' + sheet.pdf, sheet.id + '-cheat-sheet.pdf');
      track('download_pdf', sheet, { pdf_source: 'file' });
      return;
    }

    pdfBtn.disabled = true;
    pdfBtn.setAttribute('aria-busy', 'true');
    pdfLabel.textContent = 'Preparing…';
    try {
      await buildPdf(sheet);
      track('download_pdf', sheet, { pdf_source: 'generated' });
    } catch (error) {
      console.error(error);
      showToast('Sorry, the PDF didn’t work. Try again?');
    } finally {
      pdfBtn.disabled = false;
      pdfBtn.removeAttribute('aria-busy');
      pdfLabel.textContent = 'Save PDF';
    }
  });

  // ---------- Links like cheat-sheets.html#color-match ----------

  function sheetFromHash() {
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (error) { /* keep raw */ }
    return findSheet(id);
  }

  function openFromHash() {
    const sheet = sheetFromHash();
    if (sheet) {
      if (current !== sheet) {
        searchInput.value = '';
        setCategory(sheet.category);
        openViewer(sheet, { fromLink: true });
      }
    } else if (viewer.open) {
      pushedHistory = false; // the hash is already gone, don't go back again
      viewer.close();
    }
  }

  // Back/forward buttons and edited links
  window.addEventListener('hashchange', openFromHash);

  render();
  openFromHash();
})();
