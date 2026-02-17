(function() {
    const tema = localStorage.getItem('tema-usuario') || 'modo-oscuro';
    document.documentElement.className = tema;
    document.documentElement.style.backgroundColor = tema === 'modo-oscuro' ? '#000000' : '#FFF0F6';
})();

(function() {
    const elReloj = document.getElementById('reloj');
    if (!elReloj) return;

    const actualizarReloj = () => {
        const ahora = new Date();
        let horas = ahora.getHours();
        const minutos = ahora.getMinutes().toString().padStart(2, '0');
        const segundos = ahora.getSeconds().toString().padStart(2, '0');

        horas = horas % 12 || 12;
        elReloj.textContent = `${horas}:${minutos}:${segundos}`;
    };

    actualizarReloj();
    setInterval(actualizarReloj, 1000);
})();

window.aplicarTemaGuardado = function() {
    const tema = localStorage.getItem('tema-usuario') || 'modo-oscuro';
    document.documentElement.className = tema;
    document.body.className = tema;
};

window.cambiarTema = function() {
    const esClaro = document.body.classList.contains('modo-claro');
    const nuevoTema = esClaro ? 'modo-oscuro' : 'modo-claro';
    
    document.documentElement.className = nuevoTema;
    document.body.className = nuevoTema;
    document.documentElement.style.backgroundColor = nuevoTema === 'modo-oscuro' ? '#000000' : '#FFF0F6';
    localStorage.setItem('tema-usuario', nuevoTema);
};

window.confirmarSalida = function() {
    const esClaro = localStorage.getItem('tema-usuario') === 'modo-claro';

    Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ff375f',
        cancelButtonColor: esClaro ? '#d1d1d6' : '#3a3a3c',
        confirmButtonText: 'Cerrarla',
        cancelButtonText: 'Cancelar',
        background: esClaro ? '#ffffff' : '#1c1c1e',
        color: esClaro ? '#1c1c1e' : '#ffffff',
        backdrop: `rgba(0,0,0,0.4)`,
        didOpen: (popup) => {
            popup.style.borderRadius = '20px';
        }
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("usuario");
            window.location.href = "login.html";
        }
    });
};

aplicarTemaGuardado();