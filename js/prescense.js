import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
const FOTO_DEFAULT = "./imgs/usuario.png";

const canal = supabase.channel('online-users', {
    config: { presence: { key: sesion.username } }
});

async function reportarPresencia() {
    if (!sesion.username) return;
    const fotoParaTrack = localStorage.getItem("foto-perfil") || sesion.foto || FOTO_DEFAULT;
    
    await canal.track({
        username: sesion.username,
        foto: fotoParaTrack,
        conectado_el: new Date().toISOString()
    });
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reportarPresencia();
});

canal.on('presence', { event: 'sync' }, () => {
    const estado = canal.presenceState();
    const contenedor = document.getElementById('listaUsuarios');
    
    if (contenedor) {
        contenedor.innerHTML = "";
        const unicos = new Map();
        Object.keys(estado).forEach(userKey => {
            const info = estado[userKey][0];
            if (info.username) unicos.set(info.username, info);
        });

        unicos.forEach((info, nombre) => {
            const hora = info.conectado_el ? new Date(info.conectado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
            const foto = info.foto || FOTO_DEFAULT;

            contenedor.innerHTML += `
                <div class="usuario-item" onclick="window.verDetalleUsuario ? verDetalleUsuario('${nombre}', '${foto}', '${hora}') : null">
                    <div class="punto-estado online"></div>
                    <div class="detalles-user">
                        <span class="nombre">${nombre}</span>
                        <span class="conexion">En línea ahora</span>
                    </div>
                    <img src="${foto}" style="width: 35px; height: 35px; border-radius: 50%; margin-left: auto; object-fit: cover; border: 2px solid var(--primary);">
                </div>
            `;
        });
    }
}).subscribe(async (status) => {
    if (status === 'SUBSCRIBED') await reportarPresencia();
});

window.actualizarPresenciaGlobal = reportarPresencia;