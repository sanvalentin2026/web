const btnTema = document.getElementById('btn-tema');
const themeIcon = document.getElementById('theme-icon');

btnTema.addEventListener('click', () => {
    document.body.classList.toggle('modo-oscuro');
    
    // Cambiar el icono según el modo
    if (document.body.classList.contains('modo-oscuro')) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('tema', 'oscuro');
    } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('tema', 'claro');
    }
});

// Cargar tema guardado al iniciar
if (localStorage.getItem('tema') === 'oscuro') {
    document.body.classList.add('modo-oscuro');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

const header = document.querySelector('.main-header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 25) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});