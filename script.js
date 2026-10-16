window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.heading').classList.add('is-visible');
});

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    document.querySelector('.widget').classList.add('is-visible');
  }
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

document.querySelector('.btn_oval').addEventListener('click', openPopup);
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
