import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
const FOTO_DEFAULT = "./imgs/usuario.png";

const canal = supabase.channel('online-users', {
    config: { presence: { key: sesion.username } }
});

// Almacén temporal para mantener usuarios que "salieron" por 5 segundos
let usuariosBuffer = new Map();

async function reportarPresencia() {
    if (!sesion.username) return;
    const fotoParaTrack = localStorage.getItem("foto-perfil") || sesion.foto || FOTO_DEFAULT;
    
    // Convertimos la URL a minúsculas para evitar errores
    const path = window.location.pathname.toLowerCase();

    // Detección mejorada
    let paginaActual = 'Navegando';
    if (path.includes('profile.') || path.includes('perfil')) {
        paginaActual = 'En Perfil';
    } else if (path.includes('index.') || path === '/' || path.endsWith('.html') === false) {
        paginaActual = 'En Inicio';
    } else if (path.includes('stats') || path.includes('estadistica')) {
        paginaActual = 'En Estadísticas';
    } else if (path.includes('reportar') || path.includes('pedido')) {
        paginaActual = 'En Reportes';
    }

    await canal.track({
        username: sesion.username,
        foto: fotoParaTrack,
        estado_web: paginaActual,
        conectado_el: new Date().toISOString()
    });
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reportarPresencia();
});

canal.on('presence', { event: 'sync' }, () => {
    const estadoReal = canal.presenceState();
    const contenedor = document.getElementById('listaUsuarios');
    if (!contenedor) return;

    // 1. Obtener usuarios actualmente reportados por Supabase
    const usuariosActivos = new Map();
    Object.keys(estadoReal).forEach(userKey => {
        const info = estadoReal[userKey][0];
        if (info.username) usuariosActivos.set(info.username, info);
    });

    // 2. Actualizar el buffer: Si el usuario está activo, lo guardamos/actualizamos
    usuariosActivos.forEach((info, nombre) => {
        if (usuariosBuffer.has(nombre)) {
            clearTimeout(usuariosBuffer.get(nombre).timeout);
        }
        usuariosBuffer.set(nombre, { ...info, timeout: null });
    });

    // 3. Revisar quiénes estaban en el buffer pero ya no están en Supabase (salida detectada)
    usuariosBuffer.forEach((info, nombre) => {
        if (!usuariosActivos.has(nombre) && !info.timeout) {
            // Le damos 5 segundos de "vida extra" antes de borrarlo
            const timeout = setTimeout(() => {
                usuariosBuffer.delete(nombre);
                dibujarHTML(contenedor);
            }, 5000); 
            usuariosBuffer.get(nombre).timeout = timeout;
        }
    });

    dibujarHTML(contenedor);
}).subscribe(async (status) => {
    if (status === 'SUBSCRIBED') await reportarPresencia();
});

function dibujarHTML(contenedor) {
    contenedor.innerHTML = "";
    usuariosBuffer.forEach((info, nombre) => {
        const hora = info.conectado_el ? new Date(info.conectado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
        const foto = info.foto || FOTO_DEFAULT;
        
        // Usamos info.estado_web que es lo que envías en canal.track
        // Si por alguna razón no existe, ponemos 'En línea' por defecto
        const ubicacionActual = info.estado_web || 'En línea';

        contenedor.innerHTML += `
            <div class="usuario-item" onclick="window.verDetalleUsuario ? verDetalleUsuario('${nombre}', '${foto}', '${hora}') : null">
                <div class="punto-estado online"></div>
                <div class="detalles-user">
                    <span class="nombre">${nombre}</span>
                    <span class="conexion">${ubicacionActual}</span>
                </div>
                <img src="${foto}" style="width: 35px; height: 35px; border-radius: 50%; margin-left: auto; object-fit: cover; border: 2px solid var(--primary);">
            </div>
        `;
    });
}

window.actualizarPresenciaGlobal = reportarPresencia;