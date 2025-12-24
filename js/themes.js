document.addEventListener('DOMContentLoaded', () => {
    // 1. Identificamos los elementos (Asegúrate que el ID sea btn-tema)
    const boton = document.getElementById('btn-tema');
    const icono = document.getElementById('theme-icon');

    // 2. Función de cambio ultra rápida
    function switchTheme(modo) {
        // Esto limpia todo y pone solo la clase que tu CSS reconoce
        document.body.className = modo;
        
        // Guardamos en tu variable de siempre
        localStorage.setItem('tema-usuario', modo);

        // Cambiamos el icono (Luna para oscuro, Sol para claro)
        if (icono) {
            if (modo === 'modo-oscuro') {
                icono.classList.remove('fa-moon');
                icono.classList.add('fa-sun');
            } else {
                icono.classList.remove('fa-sun');
                icono.classList.add('fa-moon');
            }
        }
    }

    // 3. Cargar el que ya estaba guardado al abrir la página
    const guardado = localStorage.getItem('tema-usuario') || 'modo-claro';
    switchTheme(guardado);

    // 4. EL BOTÓN (Aquí es donde estaba fallando)
    if (boton) {
        boton.onclick = () => {
            // Si actualmente es claro, cámbielo a oscuro. Si es oscuro, a claro.
            if (document.body.classList.contains('modo-claro')) {
                switchTheme('modo-oscuro');
            } else {
                switchTheme('modo-claro');
            }
        };
    }

    // Fix para que reportar.html se entere del cambio
    window.onstorage = (e) => {
        if (e.key === 'tema-usuario') switchTheme(e.newValue);
    };
});