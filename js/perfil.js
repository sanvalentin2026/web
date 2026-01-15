import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FOTO_DEFAULT = "./imgs/usuario.png";
const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");

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
            this.buffer[nombre].preload = 'auto'; // Precarga en segundo plano
            this.buffer[nombre].volume = 0.3;
        }
    },

    play(nombre) {
        const sonido = this.buffer[nombre];
        if (sonido) {
            // requestAnimationFrame asegura que el audio no interrumpa la animación de la alerta
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
    document.getElementById('imgPerfil').src = sesion.foto || FOTO_DEFAULT;
    
    const contenedor = document.getElementById('contenedorInsignias');
    let html = '';
    
    if (sesion.username === "Alexei Chaves") {
        html += '<span class="insignia dev">Desarrollador</span>';
        html += '<span class="insignia admin">Soporte</span>';
    } else {
        html += '<span class="insignia vendedor">Vendedor/a</span>';
    }
    contenedor.innerHTML = html;
}

document.getElementById('inputFoto').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        const fotoComprimida = await comprimirImagen(file);
        document.getElementById('imgPerfil').src = fotoComprimida;
        
        sesion.foto = fotoComprimida;
        localStorage.setItem("usuario", JSON.stringify(sesion));
        
        await canal.track({
            username: sesion.username,
            foto: sesion.foto,
            conectado_el: new Date().toISOString()
        });

// 1. Detectamos el tema actual del localStorage
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
        // 1. Corregimos el contenedor del Toast
        toast.style.borderRadius = '20px';
// ✅ Correcto
        toast.style.fontSize = "1.2rem";            
    }
});
    }
});

window.verDetalleUsuario = function(username, foto, hora) {
    const fotoFinal = (foto && foto !== "undefined") ? foto : FOTO_DEFAULT;
    
    let insigniasHtml = '';
    if (username === "Alexei Chaves") {
        insigniasHtml = '<span class="insignia dev">Desarollador</span><span class="insignia admin">Soporte</span>';
    } else {
        insigniasHtml = '<span class="insignia vendedor">Vendedor</span>';
    }

    Swal.fire({
        html: `
            <div style="padding: 20px; text-align: center;">
                <img src="${fotoFinal}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border:3px solid #ff375f; margin-bottom:15px;">
                <div style="font-size:1.5rem; font-weight:bold; color:white;">${username}</div>
                <div class="badges-list" style="display:flex; justify-content:center; gap:8px;">${insigniasHtml}</div>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        background: '#1a1a1a'
    });
};

function dibujarListaUsuarios(estado) {
    const contenedor = document.getElementById('listaUsuarios');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    Object.keys(estado).forEach(userKey => {
        const info = estado[userKey][0];
        const nombreMostrar = info.username || userKey;
        const hora = info.conectado_el ? new Date(info.conectado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
        const foto = info.foto || FOTO_DEFAULT;

        contenedor.innerHTML += `
            <div class="usuario-item" onclick="verDetalleUsuario('${nombreMostrar}', '${foto}', '${hora}')">
                <div class="punto-estado online"></div>
                <div class="detalles-user">
                    <span class="nombre">${nombreMostrar}</span>
                    <span class="conexion">Conectado ahora</span>
                </div>
            </div>
        `;
    });
}

const canal = supabase.channel('online-users', {
    config: { presence: { key: sesion.username } }
});

canal.on('presence', { event: 'sync' }, () => {
    dibujarListaUsuarios(canal.presenceState());
}).subscribe(async (status) => {
    if (status === 'SUBSCRIBED' && sesion.username) {
        await canal.track({
            username: sesion.username,
            foto: sesion.foto || FOTO_DEFAULT,
            conectado_el: new Date().toISOString()
        });
    }
});

document.addEventListener('DOMContentLoaded', inicializarPerfil);