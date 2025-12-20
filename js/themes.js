// Esperamos a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const btnConfig = document.getElementById('boton-clima');
    const iconoClima = document.getElementById('icono-clima');

    // 1. APLICAR EL TEMA AL CARGAR (En todas las páginas)
    const modoGuardado = localStorage.getItem('tema-usuario') || 'modo-oscuro';
    document.body.classList.add(modoGuardado);

    // 2. ACTUALIZAR ICONO (Solo si existen los elementos en el HTML actual)
    function actualizarIcono(modo) {
        if (!iconoClima) return; // Si no hay icono en esta página, no hace nada
        
        if (modo === 'modo-oscuro') {
            iconoClima.classList.remove('fa-sun');
            iconoClima.classList.add('fa-moon');
        } else {
            iconoClima.classList.remove('fa-moon');
            iconoClima.classList.add('fa-sun');
        }
    }

    // Ejecutar actualización inicial de icono
    actualizarIcono(modoGuardado);

    // 3. LÓGICA DEL BOTÓN (Solo si el botón existe en el HTML actual)
    if (btnConfig) {
        btnConfig.addEventListener('click', () => {
            const esOscuro = document.body.classList.contains('modo-oscuro');
            let nuevoModo;

            if (esOscuro) {
                document.body.classList.replace('modo-oscuro', 'modo-claro');
                nuevoModo = 'modo-claro';
            } else {
                document.body.classList.replace('modo-claro', 'modo-oscuro');
                nuevoModo = 'modo-oscuro';
            }

            // Guardar y actualizar icono globalmente
            localStorage.setItem('tema-usuario', nuevoModo);
            actualizarIcono(nuevoModo);
        });
    }
});