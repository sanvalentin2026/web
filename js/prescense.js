
const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
const FOTO_DEFAULT = "./imgs/usuario.png";

function validarCampo(valor, maxLen = 200) {
    if (!valor) return '';
    const v = String(valor).trim();
    return v.length > maxLen ? v.slice(0, maxLen) : v;
}

const canal = db.channel('online-users', {
    config: { presence: { key: sesion.username } }
});

// Almacén temporal para mantener usuarios que "salieron" por 5 segundos
let usuariosBuffer = new Map();

async function reportarPresencia() {
    if (!sesion.username) return;
    const fotoParaTrack = localStorage.getItem("foto-perfil") || sesion.foto || FOTO_DEFAULT;
    
    // Mejor detección de página actual
    const path = window.location.pathname.toLowerCase();
    const page = path.replace(/^\/+|\/+$/g, ''); // quita / inicial/final
    let paginaActual = 'Navegando';
    if (page === '' || page === 'index.html') {
        paginaActual = 'En Inicio';
    } else if (page === 'login.html') {
        paginaActual = 'En Login';
    } else if (page === 'register.html') {
        paginaActual = 'En Registro';
    } else if (page === 'porfile.html' || page === 'perfil.html' || page.includes('perfil') || page.includes('profile')) {
        paginaActual = 'En Perfil';
    } else if (page === 'stats.html' || page.includes('estadistica') || page.includes('stats')) {
        paginaActual = 'En Estadísticas';
    } else if (page === 'stock.html') {
        paginaActual = 'En Inventario';
    } else if (page === 'reportar.html' || page.includes('reportar')) {
        paginaActual = 'En Reportes';
    } else if (page === 'mantenimiento.html') {
        paginaActual = 'En Mantenimiento';
    } else if (page.endsWith('.html')) {
        // Si es otra página html, muestra el nombre base
        paginaActual = 'En ' + page.replace('.html','').replace(/\b\w/g, l => l.toUpperCase());
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
        if (info && info.username) usuariosActivos.set(info.username, info);
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
    // Limpiar de forma segura
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    usuariosBuffer.forEach((info, nombre) => {
        const hora = info.conectado_el ? new Date(info.conectado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
        const foto = info.foto || FOTO_DEFAULT;
        const ubicacionActual = info.estado_web || 'Conectado/a';

        const item = document.createElement('div');
        item.className = 'usuario-item';
        item.tabIndex = 0;
        item.addEventListener('click', () => { if (window.verDetalleUsuario) window.verDetalleUsuario(nombre, foto, hora); });

        const punto = document.createElement('div');
        punto.className = 'punto-estado online';

        const detalles = document.createElement('div');
        detalles.className = 'detalles-user';
        const spanNombre = document.createElement('span'); spanNombre.className = 'nombre'; spanNombre.textContent = validarCampo(nombre, 60);
        const spanConexion = document.createElement('span'); spanConexion.className = 'conexion'; spanConexion.textContent = validarCampo(ubicacionActual, 60);
        detalles.appendChild(spanNombre); detalles.appendChild(spanConexion);

        const img = document.createElement('img');
        try { img.src = (typeof foto === 'string' && (foto.startsWith('data:') || foto.startsWith('http') || foto.startsWith('./') || foto.startsWith('/imgs'))) ? foto : FOTO_DEFAULT; } catch (e) { img.src = FOTO_DEFAULT; }
        img.style.width = '35px'; img.style.height = '35px'; img.style.borderRadius = '50%'; img.style.marginLeft = 'auto'; img.style.objectFit = 'cover'; img.style.border = '2px solid var(--primary)';
        img.loading = 'lazy';

        item.appendChild(punto);
        item.appendChild(detalles);
        item.appendChild(img);

        contenedor.appendChild(item);
    });
}

window.actualizarPresenciaGlobal = reportarPresencia;