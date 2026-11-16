window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.heading').classList.add('is-visible');
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, { threshold: 0.2 });

observer.observe(document.querySelector('.cat_left'));
observer.observe(document.querySelector('.cat_right'));

// Contact popup

const FORM_ENDPOINT = 'https://formspree.io/f/xqpewoyy';

const popup = document.querySelector('.popup');
const popupForm = popup.querySelector('.popup_form');
const popupStates = popup.querySelectorAll('.popup_state');
const popupError = popup.querySelector('.popup_error');
const popupSubmit = popup.querySelector('.popup_btn_primary');
const popupFields = popupForm.querySelectorAll('.popup_input');

// States: 'form', 'error' (form + error message), 'thanks', 'socials'
function setPopupState(state) {
  const panel = state === 'error' ? 'form' : state;
  popupStates.forEach(el => {
    el.hidden = el.dataset.state !== panel;
  });
  popupError.hidden = state !== 'error';
}

function openPopup() {
  popupFields.forEach(field => field.classList.remove('is-invalid'));
  setPopupState('form');
  document.documentElement.classList.add('is-locked');
  popup.showModal();
}

function closePopup() {
  popup.close();
}

// Fires on X, CLOSE, backdrop click and Esc
popup.addEventListener('close', () => {
  document.documentElement.classList.remove('is-locked');
});

// Close on backdrop click (only if the press also started on the backdrop,
// so selecting text in an input and releasing outside doesn't close it)
let pressedOnBackdrop = false;
popup.addEventListener('mousedown', e => {
  pressedOnBackdrop = e.target === popup;
});
popup.addEventListener('click', e => {
  if (e.target === popup && pressedOnBackdrop) closePopup();
});

document.querySelector('.header_btn').addEventListener('click', openPopup);
popup.querySelector('.popup_close').addEventListener('click', closePopup);
popup.querySelector('.popup_done').addEventListener('click', closePopup);

popup.querySelector('.popup_write').addEventListener('click', () => {
  setPopupState('socials');
  popup.querySelector('.popup_back').focus();
});

popup.querySelector('.popup_back').addEventListener('click', () => {
  setPopupState('form');
  popup.querySelector('.popup_write').focus();
});

function validateForm() {
  let isValid = true;
  popupForm.querySelectorAll('[required]').forEach(field => {
    const isEmpty = !field.value.trim();
    field.classList.toggle('is-invalid', isEmpty);
    if (isEmpty) isValid = false;
  });
  return isValid;
}

// Throws on network errors and non-ok responses, so the error state is shown
async function sendForm(formData) {
  const response = await fetch(FORM_ENDPOINT, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error('Form request failed');
}

popupForm.addEventListener('submit', async e => {
  e.preventDefault();

  if (!validateForm()) {
    setPopupState('error');
    return;
  }

  if (popupSubmit.disabled) return;
  popupSubmit.disabled = true;
  try {
    await sendForm(new FormData(popupForm));
    popupForm.reset();
    resizeTextarea();
    setPopupState('thanks');
    popup.querySelector('.popup_done').focus();
  } catch (err) {
    setPopupState('error');
  } finally {
    popupSubmit.disabled = false;
  }
});

// Remove the red border as soon as a field is filled in
popupFields.forEach(field => {
  field.addEventListener('input', () => {
    if (field.value.trim()) field.classList.remove('is-invalid');
    if (!popupForm.querySelector('.is-invalid')) popupError.hidden = true;
  });
});

// The project field grows with its text (up to the max-height set in CSS)
const popupTextarea = popupForm.querySelector('.popup_textarea');

function resizeTextarea() {
  popupTextarea.style.height = '';
  popupTextarea.style.height = popupTextarea.scrollHeight + 2 + 'px';
}

popupTextarea.addEventListener('input', resizeTextarea);

// Prices: tabs of "What working with me looks like"

const pricesFolder = document.querySelector('.prices_folder');
const pricesShape = pricesFolder.querySelector('.prices_shape');
const pricesPanel = pricesFolder.querySelector('.prices_panel');
const pricesSteps = pricesPanel.querySelectorAll('.prices_step');
const pricesDecos = document.querySelectorAll('.prices_deco');
const pricesStage = document.querySelector('.prices_stage');
const pricesPhone = window.matchMedia('(max-width: 768px)');
const pricesCalm = window.matchMedia('(prefers-reduced-motion: reduce)');

// These have to match the animations in style.css
const PRICES_OUT = 240; // old images and text are gone
const PRICES_IN = 360; // new images and text are in place
const PRICES_FADE = 200; // the same with reduced motion: one short fade

let pricesTabs = [];
let pricesIndex = 0;
let pricesTimer;
let pricesBusy = false; // an animation is running, ignore clicks
let pricesRevealed = false; // the side images stay hidden until the section is seen

// One path per tab plus the folder itself. Numbers are for a 35px tab row
// and scale with it. Each tab sits on top of the one to its right
function drawPricesShape() {
  const width = pricesFolder.offsetWidth;
  const height = pricesFolder.offsetHeight;
  const tabH = pricesTabs[0].offsetHeight;
  const u = tabH / 35;
  const radius = 15 * u;
  const edges = pricesTabs.map(tab => tab.offsetLeft);
  edges.push(edges[edges.length - 1] + pricesTabs[pricesTabs.length - 1].offsetWidth);

  const slantEnd = x => `L${x - 12 * u} 0 Q${x - 6 * u} 0 ${x - 2.5 * u} ${5 * u} L${x + 13 * u} ${27 * u} Q${x + 18 * u} ${tabH} ${x + 25 * u} ${tabH}`;
  const roundEnd = x => `L${x - 12 * u} 0 Q${x - 6 * u} 0 ${x - 2.5 * u} ${6 * u} Q${x + u} ${12 * u} ${x} ${18 * u} Q${x - u} ${tabH} ${x - 14 * u} ${tabH}`;
  const topLeft = x => `L${x} ${10 * u} Q${x + 3 * u} 0 ${x + 13 * u} 0`;
  const firstTopLeft = `L0 ${radius} Q0 0 ${radius} 0`;

  let paths = '';
  for (let i = pricesTabs.length - 1; i >= 0; i--) {
    if (i === pricesIndex) continue;
    const start = i === 0
      ? `M0 ${tabH + radius + 2} ${firstTopLeft}`
      : `M${edges[i] - 14 * u} ${tabH} ${topLeft(edges[i])}`;
    const end = i < pricesIndex ? roundEnd(edges[i + 1]) : slantEnd(edges[i + 1]);
    paths += `<path d="${start} ${end} Z"/>`;
  }

  const left = edges[pricesIndex];
  const activeStart = pricesIndex === 0
    ? firstTopLeft
    : `L0 ${tabH + radius} Q0 ${tabH} ${radius} ${tabH} L${left - 14 * u} ${tabH} Q${left - u} ${tabH} ${left} ${18 * u} ${topLeft(left)}`;
  paths += `<path class="is-active" d="M0 ${height - radius} ${activeStart} ${slantEnd(edges[pricesIndex + 1])}
    L${width - radius} ${tabH} Q${width} ${tabH} ${width} ${tabH + radius}
    L${width} ${height - radius} Q${width} ${height} ${width - radius} ${height}
    L${radius} ${height} Q0 ${height} 0 ${height - radius} Z"/>`;

  pricesShape.innerHTML = paths;
}

// Tabs and the folder change at once
function updatePricesTabs() {
  pricesTabs.forEach((el, i) => {
    el.setAttribute('aria-selected', i === pricesIndex);
    el.tabIndex = i === pricesIndex ? 0 : -1;
  });
  drawPricesShape();
}

function updatePricesDecos() {
  const name = pricesTabs[pricesIndex].dataset.deco;
  pricesDecos.forEach(deco => {
    deco.classList.toggle('is-active', pricesRevealed && deco.dataset.deco === name);
  });
}

function updatePricesSteps() {
  const tab = pricesTabs[pricesIndex];
  const steps = tab.dataset.steps.split(' ');
  pricesPanel.setAttribute('aria-labelledby', tab.id);
  pricesSteps.forEach(step => {
    step.hidden = !steps.includes(step.dataset.step);
  });
}

function stopPricesAnimation() {
  clearTimeout(pricesTimer);
  pricesBusy = false;
  [pricesPanel, ...pricesDecos].forEach(el => el.classList.remove('is-leaving', 'is-entering'));
}

// The current tab's images slide in from the screen edges
function playPricesDecosIn() {
  pricesBusy = true;
  updatePricesDecos();
  pricesDecos.forEach(deco => {
    deco.classList.remove('is-leaving');
    deco.classList.toggle('is-entering', deco.classList.contains('is-active'));
  });
  clearTimeout(pricesTimer);
  pricesTimer = setTimeout(stopPricesAnimation, pricesCalm.matches ? PRICES_FADE : PRICES_IN);
}

// Old images and text are out of sight: swap them for the new ones
function playPricesIn() {
  updatePricesSteps();
  pricesPanel.classList.remove('is-leaving');
  pricesPanel.classList.add('is-entering');
  playPricesDecosIn();
}

// Images slide out and the text fades out, then the new ones come in.
// Clicks during the animation are ignored
function showPricesTab(index) {
  const next = (index + pricesTabs.length) % pricesTabs.length;
  if (pricesBusy || next === pricesIndex) return;
  pricesBusy = true;
  pricesIndex = next;
  markPricesRevealed();
  updatePricesTabs();

  if (pricesCalm.matches) {
    playPricesIn();
    return;
  }

  pricesPanel.classList.add('is-leaving');
  pricesDecos.forEach(deco => {
    deco.classList.toggle('is-leaving', deco.classList.contains('is-active'));
  });
  pricesTimer = setTimeout(playPricesIn, PRICES_OUT);
}

// The first tab's images slide in once, when the section scrolls into view
const pricesReveal = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  markPricesRevealed();
  playPricesDecosIn();
}, { threshold: 0.25 });

function markPricesRevealed() {
  pricesRevealed = true;
  pricesReveal.disconnect();
}

// Phone and desktop have different tabs: keep showing the same steps when switching
function setupPricesTabs() {
  const list = pricesPhone.matches ? '.prices_tabs_phone' : '.prices_tabs_desktop';
  const firstStep = pricesTabs.length
    ? pricesTabs[pricesIndex].dataset.steps.split(' ')[0]
    : '1';
  pricesTabs = [...pricesFolder.querySelectorAll(`${list} [role="tab"]`)];
  pricesIndex = pricesTabs.findIndex(tab => tab.dataset.steps.split(' ').includes(firstStep));
  stopPricesAnimation();
  updatePricesTabs();
  updatePricesSteps();
  updatePricesDecos();
}

pricesFolder.querySelectorAll('[role="tab"]').forEach(tab => {
  tab.addEventListener('click', () => showPricesTab(pricesTabs.indexOf(tab)));
});

pricesFolder.querySelectorAll('[role="tablist"]').forEach(list => {
  list.addEventListener('keydown', e => {
    const targets = {
      ArrowLeft: pricesIndex - 1,
      ArrowRight: pricesIndex + 1,
      Home: 0,
      End: pricesTabs.length - 1
    };
    if (!(e.key in targets)) return;
    e.preventDefault();
    showPricesTab(targets[e.key]);
    pricesTabs[pricesIndex].focus();
  });
});

pricesFolder.querySelector('.prices_arrow_prev').addEventListener('click', () => showPricesTab(pricesIndex - 1));
pricesFolder.querySelector('.prices_arrow_next').addEventListener('click', () => showPricesTab(pricesIndex + 1));

// Swipe left/right on the box
let pricesTouch = null;

pricesFolder.addEventListener('touchstart', e => {
  pricesTouch = e.touches.length === 1 ? e.touches[0] : null;
}, { passive: true });

pricesFolder.addEventListener('touchend', e => {
  if (!pricesTouch) return;
  const end = e.changedTouches[0];
  const dx = end.clientX - pricesTouch.clientX;
  const dy = end.clientY - pricesTouch.clientY;
  pricesTouch = null;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    showPricesTab(pricesIndex + (dx < 0 ? 1 : -1));
  }
});

pricesPhone.addEventListener('change', setupPricesTabs);
new ResizeObserver(drawPricesShape).observe(pricesFolder);
document.fonts.ready.then(drawPricesShape);

setupPricesTabs();
pricesReveal.observe(pricesStage);
