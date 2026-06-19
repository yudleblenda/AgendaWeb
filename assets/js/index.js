const linksInternos = document.querySelectorAll('a[href^="#"]');

linksInternos.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();

    const id = link.getAttribute('href');
    const secao = document.querySelector(id);

    if (secao) {
      secao.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});