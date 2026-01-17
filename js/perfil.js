import { verificarSesion } from './auth.js'; 

    const init = async () => {
      try {
        await verificarSesion();
        document.body.style.display = 'block';
      } catch (e) {
        window.location.replace("login.html");
      }
    };
    init();

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

// Pequeñas utilidades locales para evitar XSS
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function validarCampo(valor, maxLen = 200) {
    if (!valor) return '';
    const v = String(valor).trim();
    return v.length > maxLen ? v.slice(0, maxLen) : v;
}
function inicializarPerfil() {
    if (!sesion.username) {
        window.location.replace("login.html");
        return;
    }

    document.getElementById('nombrePerfil').textContent = sesion.username;
    document.getElementById('imgPerfil').src = fotoPersistente || sesion.foto || FOTO_DEFAULT;
    
    const contenedor = document.getElementById('contenedorInsignias');
    if (contenedor) {
        contenedor.innerHTML = '';
        if ((sesion.username || '').trim() === "Alexei Chaves") {
            const s1 = document.createElement('span');
            s1.className = 'insignia dev';
            s1.textContent = 'Desarrollador';
            const s2 = document.createElement('span');
            s2.className = 'insignia admin';
            s2.textContent = 'Soporte';
            contenedor.appendChild(s1);
            contenedor.appendChild(s2);
        } else {
            const s = document.createElement('span');
            s.className = 'insignia vendedor';
            s.textContent = 'Vendedor/a';
            contenedor.appendChild(s);
        }
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
            title: 'Foto guardada',
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

    const safeName = validarCampo(username, 100);
    const safeHora = validarCampo(hora, 50);
    const safeFoto = (typeof foto === 'string' && (foto.startsWith('data:') || foto.startsWith('http') || foto.startsWith('./') || foto.startsWith('/imgs'))) ? foto : FOTO_DEFAULT;

    Swal.fire({
        html: '<div id="swal-perfil-placeholder"></div>',
        showConfirmButton: false,
        showCloseButton: true,
        background: esClaro ? '#ffffff' : '#1c1c1e',
        color: colorTexto,
        didOpen: (popup) => {
            popup.style.borderRadius = '20px';
            const container = Swal.getHtmlContainer();

            const wrapper = document.createElement('div');
            wrapper.style.padding = '10px';
            wrapper.style.textAlign = 'center';

            const img = document.createElement('img');
            img.src = safeFoto;
            img.style.width = '120px';
            img.style.height = '120px';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
            img.style.border = '3px solid #ff375f';
            img.style.marginBottom = '15px';
            img.style.boxShadow = '0 4px 15px rgba(255, 55, 95, 0.3)';
            img.loading = 'lazy';

            const nameDiv = document.createElement('div');
            nameDiv.style.fontSize = '1.5rem';
            nameDiv.style.fontWeight = 'bold';
            nameDiv.style.color = colorTexto;
            nameDiv.textContent = safeName;

            const insigniasWrap = document.createElement('div');
            insigniasWrap.style.display = 'flex';
            insigniasWrap.style.justifyContent = 'center';
            insigniasWrap.style.gap = '8px';
            insigniasWrap.style.marginTop = '10px';

            if (safeName === 'Alexei Chaves') {
                const d = document.createElement('span'); d.className = 'insignia dev'; d.textContent = 'Desarrollador';
                const a = document.createElement('span'); a.className = 'insignia admin'; a.textContent = 'Soporte';
                insigniasWrap.appendChild(d); insigniasWrap.appendChild(a);
            } else {
                const v = document.createElement('span'); v.className = 'insignia vendedor'; v.textContent = 'Vendedor/a';
                insigniasWrap.appendChild(v);
            }

            const lastDiv = document.createElement('div');
            lastDiv.style.marginTop = '15px';
            lastDiv.style.fontSize = '0.85rem';
            lastDiv.style.color = esClaro ? '#636366' : '#8e8e93';
            const icon = document.createElement('i');
            icon.className = 'fa-regular fa-clock';
            lastDiv.appendChild(icon);
            lastDiv.appendChild(document.createTextNode(' Última actividad: ' + escapeHTML(safeHora)));

            wrapper.appendChild(img);
            wrapper.appendChild(nameDiv);
            wrapper.appendChild(insigniasWrap);
            wrapper.appendChild(lastDiv);

            if (container) container.appendChild(wrapper);

            const closeButton = popup.querySelector('.swal2-close');
            if (closeButton) { closeButton.style.boxShadow = 'none'; closeButton.style.outline = 'none'; }
        }
    });
};

document.addEventListener('DOMContentLoaded', inicializarPerfil);