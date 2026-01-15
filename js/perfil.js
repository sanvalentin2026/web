import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FOTO_DEFAULT = "./imgs/usuario.png";
const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
// Variable de foto independiente para evitar pérdidas en cierres de sesión
const fotoPersistente = localStorage.getItem("foto-perfil");

function comprimirImagen(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
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
    const fotoActual = fotoPersistente || sesion.foto || FOTO_DEFAULT;
    document.getElementById('imgPerfil').src = fotoActual;
    
    const contenedor = document.getElementById('contenedorInsignias');
    let html = '';
    if (sesion.username === "Alexei Chaves") {
        html += '<span class="insignia dev">Desarrollador</span><span class="insignia admin">Soporte</span>';
    } else {
        html += '<span class="insignia vendedor">Vendedor/a</span>';
    }
    contenedor.innerHTML = html;
}

// --- LÓGICA DE PRESENCE REFORZADA (SOLUCIÓN ANDROID/IOS) ---
const canal = supabase.channel('online-users', {
    config: { presence: { key: sesion.username } }
});

async function actualizarPresencia() {
    if (!sesion.username) return;
    const fotoParaTrack = localStorage.getItem("foto-perfil") || sesion.foto || FOTO_DEFAULT;
    
    await canal.track({
        username: sesion.username,
        foto: fotoParaTrack,
        conectado_el: new Date().toISOString()
    });
}

// Forzar reconexión cuando el usuario vuelve a la pestaña (Vital para móviles)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        actualizarPresencia();
    }
});

canal.on('presence', { event: 'sync' }, () => {
    dibujarListaUsuarios(canal.presenceState());
}).subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
        await actualizarPresencia();
    }
});

function dibujarListaUsuarios(estado) {
    const contenedor = document.getElementById('listaUsuarios');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    // Usar Map para evitar duplicados por múltiples pestañas o cambios de red
    const usuariosUnicos = new Map();
    Object.keys(estado).forEach(userKey => {
        const info = estado[userKey][0];
        if (info.username) usuariosUnicos.set(info.username, info);
    });

    usuariosUnicos.forEach((info, nombre) => {
        const hora = info.conectado_el ? new Date(info.conectado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
        const foto = info.foto || FOTO_DEFAULT;

        contenedor.innerHTML += `
            <div class="usuario-item" onclick="verDetalleUsuario('${nombre}', '${foto}', '${hora}')">
                <div class="punto-estado online"></div>
                <div class="detalles-user">
                    <span class="nombre">${nombre}</span>
                    <span class="conexion">Conectado ahora</span>
                </div>
                <img src="${foto}" style="width: 35px; height: 35px; border-radius: 50%; margin-left: auto; object-fit: cover; border: 2px solid var(--primary);">
            </div>
        `;
    });
}

// --- ALERTAS Y DETALLES ---
document.getElementById('inputFoto').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        const fotoComprimida = await comprimirImagen(file);
        document.getElementById('imgPerfil').src = fotoComprimida;
        localStorage.setItem("foto-perfil", fotoComprimida);
        
        await actualizarPresencia();

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
                toast.style.display = 'flex';
                toast.style.alignItems = 'center';
                const title = toast.querySelector('.swal2-title');
                if (title) {
                    title.style.margin = '0';
                    title.style.fontSize = "1.1rem";
                    title.style.display = 'flex';
                    title.style.alignItems = 'center';
                }
                const icon = toast.querySelector('.swal2-icon');
                if (icon) icon.style.margin = '0 10px 0 0';
            }
        });
    }
});

window.verDetalleUsuario = function(username, foto, hora) {
    const fotoFinal = (foto && foto !== "undefined") ? foto : FOTO_DEFAULT;
    const esClaro = localStorage.getItem('tema-usuario') === 'modo-claro';
    const colorTexto = esClaro ? '#1c1c1e' : '#ffffff';

    let insigniasHtml = username === "Alexei Chaves" 
        ? '<span class="insignia dev">Desarrollador</span><span class="insignia admin">Soporte</span>'
        : '<span class="insignia vendedor">Vendedor</span>';

    Swal.fire({
        html: `
            <div style="padding: 10px; text-align: center;">
                <img src="${fotoFinal}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border:3px solid #ff375f; margin-bottom:15px; box-shadow: 0 4px 15px rgba(255, 55, 95, 0.3);">
                <div style="font-size:1.5rem; font-weight:bold; color: ${colorTexto}; mb: 10px;">${username}</div>
                <div style="display:flex; justify-content:center; gap:8px; margin-top:10px;">${insigniasHtml}</div>
                <div style="margin-top: 15px; font-size: 0.85rem; color: ${esClaro ? '#636366' : '#8e8e93'};">
                    <i class="fa-regular fa-clock"></i> Visto a las: ${hora}
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        background: esClaro ? '#ffffff' : '#1c1c1e',
        color: colorTexto,
        didOpen: (popup) => {
            popup.style.borderRadius = '20px';
        }
    });
};

document.addEventListener('DOMContentLoaded', inicializarPerfil);