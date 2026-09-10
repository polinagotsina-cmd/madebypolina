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