setInterval(() => {
    const elReloj = document.getElementById('reloj');
    if (elReloj) {
        const ahora = new Date();
        let horas = ahora.getHours();
        const minutos = ahora.getMinutes().toString().padStart(2, '0');
        const segundos = ahora.getSeconds().toString().padStart(2, '0');

        // Convertir formato: si es 0 (medianoche) pasa a 12, 
        // si es mayor a 12 (tarde) resta 12.
        horas = horas % 12 || 12;

        elReloj.textContent = `${horas}:${minutos}:${segundos}`;
    }
}, 1000);
        // Lógica de Cerrar Sesión con SweetAlert
function confirmarSalida() {
    const esClaro = localStorage.getItem('tema-usuario') === 'modo-claro';

    Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff375f',
        cancelButtonColor: esClaro ? '#d1d1d6' : '#3a3a3c',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        // --- ADAPTACIÓN DE TEMA ---
        background: esClaro ? '#ffffff' : '#1c1c1e',
        color: esClaro ? '#1c1c1e' : '#ffffff',
        didOpen: (popup) => {
            // Aplicamos los bordes redondeados de 20px
            popup.style.borderRadius = '20px';
            
            // Opcional: Si quieres que el título también esté alineado a la izquierda
            const title = popup.querySelector('.swal2-title');
            if (title) {
                title.style.textAlign = 'center'; // En diálogos grandes suele verse mejor centrado, pero puedes cambiarlo a 'left'
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("usuario");
            window.location.href = "login.html";
        }
    });
}
        function aplicarTemaGuardado() {
    const tema = localStorage.getItem('tema-usuario');
    
    if (tema === 'modo-claro') {
        document.body.classList.remove('modo-oscuro');
        document.body.classList.add('modo-claro');
    } else {
        // Por defecto o si es modo-oscuro
        document.body.classList.remove('modo-claro');
        document.body.classList.add('modo-oscuro');
    }
}
// 2. Función para el botón de cambiar tema
if (typeof window !== 'undefined') {
  window.cambiarTema = function() {
      const esClaro = document.body.classList.contains('modo-claro');
      if (esClaro) {
          document.body.classList.replace('modo-claro', 'modo-oscuro');
          localStorage.setItem('tema-usuario', 'modo-oscuro');
      } else {
          document.body.classList.replace('modo-oscuro', 'modo-claro');
          localStorage.setItem('tema-usuario', 'modo-claro');
      }
  }
}

// Asegúrate de llamar a aplicarTemaGuardado al inicio
document.addEventListener('DOMContentLoaded', () => {
    aplicarTemaGuardado();
});