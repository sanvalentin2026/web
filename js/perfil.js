const FOTO_DEFAULT = "./imgs/usuario.png";
const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
const fotoPersistente = localStorage.getItem("foto-perfil");

const ReproductorSonidos = {
    buffer: {},
    rutas: {
        exito: 'sounds/exito.mp3',
        error: 'sounds/notificacion.mp3',
        notificacion: 'sounds/notificacion.mp3',
        eliminado: 'sounds/pop.mp3'
    },
    init() {
        for (const [nombre, ruta] of Object.entries(this.rutas)) {
            this.buffer[nombre] = new Audio(ruta);
            this.buffer[nombre].preload = 'auto';
            this.buffer[nombre].volume = 0.3;
        }
    },
    play(nombre) {
        const sonido = this.buffer[nombre];
        if (sonido) {
            requestAnimationFrame(() => {
                sonido.currentTime = 0;
                sonido.play().catch(() => {});
            });
        }
    }
};
ReproductorSonidos.init();

function inicializarPerfil() {
    if (!sesion.username) {
        window.location.replace("login.html");
        return;
    }

    document.getElementById('nombrePerfil').textContent = sesion.username;
    document.getElementById('imgPerfil').src = fotoPersistente || sesion.foto || FOTO_DEFAULT;
    
    const contenedor = document.getElementById('contenedorInsignias');
    if (contenedor) {
        let html = '';
        // Lógica estricta de insignias
        if (sesion.username === "Alexei Chaves") {
            html = '<span class="insignia dev">Desarrollador</span><span class="insignia admin">Soporte</span>';
        } else {
            html = '<span class="insignia vendedor">Vendedor/a</span>';
        }
        contenedor.innerHTML = html;
    }
}

async function comprimirImagen(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
}

document.getElementById('inputFoto')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        const fotoComprimida = await comprimirImagen(file);
        document.getElementById('imgPerfil').src = fotoComprimida;
        localStorage.setItem("foto-perfil", fotoComprimida);
        
        if (window.actualizarPresenciaGlobal) await window.actualizarPresenciaGlobal();

        const esClaro = localStorage.getItem('tema-usuario') === 'modo-claro';
        ReproductorSonidos.play('exito');

        Swal.fire({
            icon: 'success',
            title: 'Foto actualizada',
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 1500,
            background: esClaro ? '#ffffff' : '#1c1c1e',
            color: esClaro ? '#1c1c1e' : '#ffffff',
            didOpen: (toast) => {
                toast.style.borderRadius = '20px';
            }
        });
    }
});

window.verDetalleUsuario = function(username, foto, hora) {
    const esClaro = localStorage.getItem('tema-usuario') === 'modo-claro';
    const colorTexto = esClaro ? '#1c1c1e' : '#ffffff';

    // Insignias en el modal según el usuario clicado
    let insigniasModal = (username === "Alexei Chaves") 
        ? '<span class="insignia dev">Desarrollador</span><span class="insignia admin">Soporte</span>'
        : '<span class="insignia vendedor">Vendedor/a</span>';

    Swal.fire({
        html: `
            <div style="padding: 10px; text-align: center;">
                <img src="${foto}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border:3px solid #ff375f; margin-bottom:15px; box-shadow: 0 4px 15px rgba(255, 55, 95, 0.3);">
                <div style="font-size:1.5rem; font-weight:bold; color: ${colorTexto}; mb: 10px;">${username}</div>
                <div style="display:flex; justify-content:center; gap:8px; margin-top:10px;">${insigniasModal}</div>
                <div style="margin-top: 15px; font-size: 0.85rem; color: ${esClaro ? '#636366' : '#8e8e93'};">
                    <i class="fa-regular fa-clock"></i> Última actividad: ${hora}
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        background: esClaro ? '#ffffff' : '#1c1c1e',
        color: colorTexto,
        didOpen: (popup) => popup.style.borderRadius = '20px'
    });
};

document.addEventListener('DOMContentLoaded', inicializarPerfil);