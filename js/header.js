const header = document.querySelector('.main-header');

// 1. CARGAR TEMA (Solo lectura para aplicar colores al iniciar)
const aplicarTemaAlInicio = () => {
    const temaGuardado = localStorage.getItem('tema-usuario') || 'modo-oscuro';
    document.body.className = temaGuardado;
};

// 2. EFECTO DE HEADER CON SCROLL
window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', aplicarTemaAlInicio);