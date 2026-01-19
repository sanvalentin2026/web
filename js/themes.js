document.addEventListener('DOMContentLoaded', () => {
    const boton = document.getElementById('btn-tema');
    const icono = document.getElementById('theme-icon');

    function actualizarInterfaz(modo) {
        // Aplicamos a html y body para asegurar que no haya bordes blancos
        document.documentElement.className = modo;
        document.body.className = modo;
        
        localStorage.setItem('tema-usuario', modo);

        if (icono) {
            if (modo === 'modo-oscuro') {
                icono.classList.replace('fa-moon', 'fa-sun');
            } else {
                icono.classList.replace('fa-sun', 'fa-moon');
            }
        }
    }

    // Inicializar al cargar
    const guardado = localStorage.getItem('tema-usuario') || 'modo-claro';
    actualizarInterfaz(guardado);

    if (boton) {
        boton.onclick = () => {
            const esClaro = document.documentElement.classList.contains('modo-claro');
            actualizarInterfaz(esClaro ? 'modo-oscuro' : 'modo-claro');
        };
    }

    window.onstorage = (e) => {
        if (e.key === 'tema-usuario') actualizarInterfaz(e.newValue);
    };
});