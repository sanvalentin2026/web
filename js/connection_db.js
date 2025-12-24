import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

/* =========================
   🔗 SUPABASE
========================= */
const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


function playNotification(tipo) {
    const sonidos = {
        success: 'si.mp3', // Ruta a tu archivo
        pago: 'applepay.mp3',       // Ruta a tu archivo
        delete: 'si.mp3',    // Ruta a tu archivo
        create: 'pedido.mp3',
        error: 'error.mp3'
    };
    
    const audio = new Audio(sonidos[tipo]);
    audio.volume = 0.9;
    // El .catch evita que el código se rompa si el navegador bloquea el audio
    audio.play().catch(() => console.log("Audio bloqueado temporalmente"));
}

/*    TEMAS    */
const obtenerTema = () => ({
    bg: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
    txt: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151'
});


/* =================================================
   🚀 CONTROL DE ACCESO (v2.2.0 - Developer Mode)
   ================================================= */

// 1. Bloqueo inicial
const blocker = document.createElement('style');
blocker.id = 'blocker-style';
blocker.innerHTML = "body { display: none !important; background: #000; }";
document.head.appendChild(blocker);


/* ======================================================
    🛡️ MONITOR DE SEGURIDAD (DEBUG MODE)
====================================================== */
function activarMonitorDeSeguridad() {
    console.log("1. Intentando iniciar monitor...");
    
    const sesionRaw = localStorage.getItem("usuario");
    if (!sesionRaw) {
        console.error("❌ No se encontró sesión en localStorage");
        return;
    }

    const sesion = JSON.parse(sesionRaw);
    console.log("2. Sesión cargada para ID:", sesion.id);

    // Creamos el canal
    const canal = supabase.channel(`monitor-${sesion.id}`);

    canal.on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'usuarios', 
        filter: `id=eq.${sesion.id}` 
    }, (payload) => {
        console.log("3. ¡DATOS RECIBIDOS DESDE DB!", payload);
        
        const valorPermiso = payload.new.permisos;
        const tema = obtenerTema();

        // CASO: TRUE
        if (valorPermiso === true || valorPermiso === 'true') {
            console.log("4. DISPARANDO ALERT: PERMISO CONCEDIDO");
            
            sesion.permisos = true;
            localStorage.setItem("usuario", JSON.stringify(sesion));

            Swal.fire({
                title: "¡Permisos concedidos!",
                text: "Ahora eres administrador.",
                icon: "success",
                background: tema.bg,
                color: tema.txt,
                confirmButtonColor: '#E11D48'
            }).then(() => { location.reload(); });
        }

        // CASO: FALSE
        if (valorPermiso === false || valorPermiso === 'false') {
            console.log("4. DISPARANDO ALERT: PERMISO RETIRADO");
            
            localStorage.removeItem("usuario");
            Swal.fire({
                title: "Permisos Retirados",
                text: "Ya no eres administrador.",
                icon: "error",
                background: tema.bg,
                color: tema.txt,
                confirmButtonColor: '#E11D48'
            }).then(() => { window.location.href = "login.html"; });
        }
    })
    .subscribe((status) => {
        console.log("5. ESTADO DE SUSCRIPCIÓN:", status);
    });
}

// FORZAR EJECUCIÓN
console.log("0. Script cargado, llamando a monitor...");
activarMonitorDeSeguridad();


async function chequearEstadoWeb() {
    // --- LLAVE MAESTRA PARA TI ---
    const urlParams = new URLSearchParams(window.location.search);
    // Si entras con ?dev=123 (puedes cambiar 123 por tu clave secreta)
    if (urlParams.get('dev') === '123' || localStorage.getItem('modo_dev') === 'activo') {
        localStorage.setItem('modo_dev', 'activo'); // Guarda la sesión para que no tengas que poner la URL siempre
        finalizarBloqueo();
        console.log("🛠️ Modo Desarrollador Activo");
        return; 
    }

    const temaActual = localStorage.getItem('theme') || 'dark';
    const esOscuro = temaActual === 'dark';
    const colFondo = esOscuro ? '#000000' : '#ffffff';
    const colTexto = esOscuro ? '#ffffff' : '#333333';

    try {
        // Realtime
        supabase.channel('config-live')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'configuracion' }, 
            () => {
                if (localStorage.getItem('modo_dev') !== 'activo') location.reload();
            }).subscribe();

        const { data, error } = await supabase.from('configuracion').select('*').single();

        if (error || !data || !data.mantenimiento) {
            finalizarBloqueo();
            return;
        }

        const target = new Date(data.fecha_apertura).getTime();
        if (target <= new Date().getTime()) {
            await ejecutarAperturaConSpinner(esOscuro, colFondo, colTexto);
            return;
        }

        // --- PANTALLA MANTENIMIENTO ---
// --- PANTALLA MANTENIMIENTO v2.2.1 ---
// --- PANTALLA MANTENIMIENTO v2.2.2 (Scroll Bloqueado) ---
document.documentElement.innerHTML = `
    <head>
        <title>Mantenimiento | San Valentín</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
            /* Bloqueo total de scroll */
            html, body { 
                margin: 0; 
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden !important; /* Evita scroll en PC */
                position: fixed; /* Evita rebote en iOS/Safari */
                background: ${colFondo} !important;
            }

            body { 
                color: ${colTexto} !important; 
                display: flex !important; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                font-family: 'Segoe UI', Roboto, sans-serif;
                padding: 20px;
                text-align: center;
                box-sizing: border-box;
            }

            .neon-title { 
                text-shadow: 0 0 15px #E11D48; 
                font-size: 1.6rem; 
                text-transform: uppercase; 
                margin-bottom: 5px; 
                color: #E11D48;
                font-weight: 800;
                letter-spacing: 1px;
            }

            .sub-texto {
                font-size: 0.95rem;
                opacity: 0.8;
                margin-bottom: 25px;
                max-width: 260px;
                line-height: 1.4;
            }

            .countdown { 
                display: flex; 
                gap: 10px; 
                justify-content: center; 
                width: 100%;
                max-width: 350px; /* Tamaño ideal para móvil */
            }

            .time-box { 
                flex: 1; 
                text-align: center; 
                border: 2px solid #E11D48; 
                padding: 12px 2px; 
                border-radius: 15px; 
                background: rgba(225, 29, 72, 0.05); 
                backdrop-filter: blur(5px);
            }

            .time-box span { 
                display: block; 
                font-size: 1.6rem; 
                font-weight: bold; 
                color: ${colTexto} !important; 
            }

            .label { 
                font-size: 0.6rem; 
                color: #E11D48; 
                margin-top: 2px; 
                font-weight: bold; 
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .btn-back { 
                margin-top: 40px; 
                padding: 12px 30px; 
                border-radius: 50px; 
                border: 1px solid rgba(225, 29, 72, 0.5); 
                background: transparent; 
                color: ${colTexto}; 
                text-decoration: none;
                font-size: 0.85rem;
                transition: 0.3s;
                opacity: 0.7;
            }
        </style>
    </head>
    <body>
        <h1 class="neon-title">EN MANTENIMIENTO</h1>
        <p class="sub-texto">La web se abrirá automáticamente en:</p>
        
        <div class="countdown">
            <div class="time-box"><span id="hours">00</span><div class="label">Horas</div></div>
            <div class="time-box"><span id="minutes">00</span><div class="label">Minutos</div></div>
            <div class="time-box"><span id="seconds">00</span><div class="label">Segundos</div></div>
        </div>

        <a href="https://google.com" class="btn-back">← Salir</a>
    </body>
`;

        setInterval(() => {
            const diff = target - new Date().getTime();
            if (diff <= 0) location.reload();
            document.getElementById('hours').innerText = Math.floor(diff / 3600000).toString().padStart(2,'0');
            document.getElementById('minutes').innerText = Math.floor((diff % 3600000) / 60000).toString().padStart(2,'0');
            document.getElementById('seconds').innerText = Math.floor((diff % 60000) / 1000).toString().padStart(2,'0');
        }, 1000);

    } catch (err) {
        finalizarBloqueo();
    }
}

async function ejecutarAperturaConSpinner(esOscuro, colFondo, colTexto) {
    await supabase.from('configuracion').update({ mantenimiento: false }).eq('id', 1);
    document.documentElement.innerHTML = `
        <style>
            body { background: ${colFondo}; margin: 0; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: sans-serif; }
            .loader-wrap { position: relative; width: 60px; height: 60px; }
            .ring { position: absolute; width: 100%; height: 100%; border: 4px solid transparent; border-top: 4px solid #E11D48; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
        </style>
        <div class="loader-wrap"><div class="ring"></div></div>
        <div style="color:${colTexto}; margin-top:20px; letter-spacing:2px">CARGANDO...</div>
    `;
    setTimeout(() => { location.reload(); }, 4000);
}

function finalizarBloqueo() {
    const el = document.getElementById('blocker-style');
    if (el) el.remove();
    document.body.style.display = 'block';
    document.body.style.opacity = '1';
}

chequearEstadoWeb();

// Esto quita el bloqueo de audio tras el primer clic del usuario
const desbloquearAudio = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    window.removeEventListener('click', desbloquearAudio);
};
window.addEventListener('click', desbloquearAudio);

async function verificarAccesoAdmin() {
    const rawData = localStorage.getItem("usuario");
    const tema = obtenerTema(); // <--- Obtenemos el tema actual
    
    if (!rawData) {
        playNotification('error');
        Swal.fire({
            title: "Sesión expirada",
            text: "Por favor, inicia sesión nuevamente.",
            icon: "warning",
            confirmButtonColor: '#E11D48',
            background: tema.bg, // <--- Aplicamos fondo
            color: tema.txt      // <--- Aplicamos texto
        }).then(() => {
            window.location.href = "login.html";
        });
        return false;
    }

    try {
        const sesion = JSON.parse(rawData);
        const { data, error } = await supabase
            .from("usuarios")
            .select("permisos")
            .eq("id", sesion.id)
            .single();

        if (error || !data?.permisos) {
            playNotification('error');
            Swal.fire({
                title: "Acceso Denegado",
                text: "No tienes permisos de administrador.",
                icon: "error",
                confirmButtonColor: '#E11D48',
                background: tema.bg,
                color: tema.txt
            });
            return false;
        }
        return true;
    } catch (e) {
        localStorage.removeItem("usuario");
        return false;
    }
}

/* =========================
   🧩 DOM
========================= */
const form = document.getElementById("pedidoForm");
const pedidosBody = document.getElementById("pedidosBody");
const seccionSelect = document.getElementById("seccion");
const seccionReceptorSelect = document.getElementById("seccion_receptor");
const buscador = document.getElementById("buscador");
const filtroSeccion = document.getElementById("filtroSeccion");
const detallesInput = document.getElementById("detalles");
const paginacionDiv = document.getElementById("paginacion");


//FIXES DE CARGADO

supabase
  .channel("pedidos-realtime")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "pedidos" },
    () => {
      if (realtimeTimeout) return;

      realtimeTimeout = setTimeout(() => {
        realtimeTimeout = null;
        cargarPedidos();
      }, 400); // 🔒 agrupa eventos
    }
  )
  .subscribe();


/* =========================
   📄 PAGINACIÓN
========================= */
const PEDIDOS_POR_PAGINA = 10;
let paginaActual = Number(sessionStorage.getItem("paginaActual")) || 1;
let paginaAnterior = paginaActual;
let pedidosCache = [];
let cargandoPedidos = false;
let pedidosFiltrados = [];

/* =========================
   📦 SECCIONES
========================= */
function generarSecciones(select) {
  select.innerHTML = "<option value=''>Seleccione una sección</option>";
  for (let i = 7; i <= 11; i++) {
    for (let j = 1; j <= 4; j++) {
      select.innerHTML += `<option value="${i}-${j}">${i}-${j}</option>`;
    }
  }
}

generarSecciones(seccionSelect);
generarSecciones(seccionReceptorSelect);
generarSecciones(filtroSeccion);

/* =========================
   📅 FECHA
========================= */
function formatFechaMobile(fechaStr) {
  const f = new Date(fechaStr);
  return `${f.getDate().toString().padStart(2,"0")}/${(f.getMonth()+1)
    .toString().padStart(2,"0")}/${f.getFullYear()} ${f
    .getHours().toString().padStart(2,"0")}:${f
    .getMinutes().toString().padStart(2,"0")}`;
}

/* =========================
   🖥️ RENDER PEDIDOS
========================= */
function renderPedidos(pedidos) {
    if (cargandoPedidos) return;
    
    let htmlFinal = "";
    const esMobile = window.innerWidth <= 900;

    if (!pedidos.length) {
        pedidosBody.innerHTML = `<tr><td colspan="7" class="no-pedidos">Sin pedidos para mostrar</td></tr>`;
        return;
    }

pedidos.forEach(p => {
    // 1. Formateamos la fecha fuera del IF para tenerla disponible
    const fechaFormateada = formatFechaMobile(p.created_at);

    // 2. Si es mobile, la ponemos en un div. Si es PC, la ponemos como texto pequeño.
    const fechaHTML = esMobile 
        ? `<div style="font-size: 11px; color: gray; margin-bottom: 5px;">📅 ${fechaFormateada}</div>` 
        : `<br><span style="font-size: 10px; opacity: 0.6;">${fechaFormateada}</span>`;

    htmlFinal += `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre_comprador} (${p.seccion_comprador})</td>
            <td>${p.nombre_receptor} (${p.seccion_receptor})</td>
            <td>${p.producto}</td>
            <td class="detalles-celda">
                ${p.detalles || "<em>Sin detalles</em>"}
                <br>
                <small style="opacity:0.5; font-size:10px; color: #E11D48;">
                    ${p.ultima_edicion_por || ""}
                </small>
            </td>
            <td>${p.pagado ? "✅" : "❌"}</td>
            <td>
                ${fechaHTML} <div class="acciones-botones">
                    <button class="btn-pago" onclick="togglePagado(${p.id}, ${p.pagado})">Pago</button>
                    <button class="btn-edit" onclick="editarDetalles(${p.id}, \`${p.detalles || ""}\`)">Detalles</button>
                    <button class="btn-del" onclick="entregarPedido(${p.id})">Eliminar</button>
                </div>
            </td>
        </tr>`;
});
    
    pedidosBody.innerHTML = htmlFinal;
}


/* =========================
   📄 RENDER PÁGINA
========================= */
function renderPagina() {
  const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
  const fin = inicio + PEDIDOS_POR_PAGINA;

  if (paginaActual > paginaAnterior) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

if (window.innerWidth <= 900 && pedidosFiltrados.length) {
  pedidosBody.classList.remove("animar-cambio");
  void pedidosBody.offsetWidth;
  pedidosBody.classList.add("animar-cambio");
}

  renderPedidos(pedidosFiltrados.slice(inicio, fin));
  renderPaginacion();

  paginaAnterior = paginaActual;
  sessionStorage.setItem("paginaActual", paginaActual);
}

/* =========================
   🔢 PAGINACIÓN
========================= */
function renderPaginacion() {
  paginacionDiv.innerHTML = "";
  const totalPaginas = Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA);
  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;

    if (i === paginaActual) btn.classList.add("activa");

    btn.onclick = () => {
      if (i === paginaActual) return;
      paginaActual = i;
      renderPagina();
    };

    paginacionDiv.appendChild(btn);
  }
}

/* =========================
   🔍 FILTROS
========================= */
function aplicarFiltros() {
  let pedidos = [...pedidosCache];

  if (filtroSeccion.value) {
    pedidos = pedidos.filter(p => p.seccion_receptor === filtroSeccion.value);
  }

  const q = buscador.value.trim().toLowerCase();
  if (q) {
    paginaActual = 1;
    pedidos = pedidos.filter(p =>
      p.id.toString() === q ||
      p.nombre_comprador.toLowerCase().includes(q) ||
      p.nombre_receptor.toLowerCase().includes(q) ||
      p.seccion_comprador.toLowerCase().includes(q) ||
      p.seccion_receptor.toLowerCase().includes(q) ||
      p.producto.toLowerCase().includes(q) ||
      p.detalles?.toLowerCase().includes(q)
    );
  }

  pedidosFiltrados = pedidos;
  renderPagina();
}


// Inyectar estilos para igualar botones de SweetAlert
// Inyectar estilos para igualar ancho y redondez de los botones
const styleSwal = document.createElement('style');
styleSwal.innerHTML = `
  .swal2-actions {
    display: flex !important;
    justify-content: center !important;
    gap: 15px !important;
    width: 100% !important;
  }
  .swal2-confirm, .swal2-cancel {
    flex: 1 !important;
    max-width: 150px !important;
    margin: 0 !important;
    padding: 12px 0 !important;
    /* Forzar la misma redondez en ambos botones */
    border-radius: 8px !important; 
    font-size: 1rem !important;
  }
`;
document.head.appendChild(styleSwal);


/* =========================
   🔄 CARGAR
========================= */
async function cargarPedidos(silencioso = false, tipoSonido = null) {
    cargandoPedidos = true;
    const tema = obtenerTema();

    // Calculamos el rango para traer solo 20 (esta página y la que sigue)
    const desde = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
    const hasta = desde + (PEDIDOS_POR_PAGINA * 2) - 1;

    if (!silencioso) {
        Swal.fire({
            title: 'Cargando...',
            background: tema.bg,
            color: tema.txt,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    }

    // CONSULTA OPTIMIZADA v1.3.9
    const { data, count, error } = await supabase
        .from("pedidos")
        .select("*", { count: 'exact' }) 
        .order("created_at", { ascending: false })
        .range(desde, hasta); // Solo trae lo necesario

    if (error) {
        console.error("Error v1.3.9:", error.message);
        return;
    }

    pedidosCache = data || [];
    // Actualizamos el total para la paginación basado en el 'count' real de la DB
    pedidosFiltrados = pedidosCache; 
    
    cargandoPedidos = false;
    renderPagina(); // Ahora renderPagina solo dibujará lo que ya filtramos por rango

    if (!silencioso) {
        if (tipoSonido) playNotification(tipoSonido);
        setTimeout(() => { Swal.close(); }, 300);
    }
}

/* =========================
    📝 REGISTRAR PEDIDO
========================= */
form.addEventListener("submit", async e => {
    e.preventDefault();
    const tema = obtenerTema();

    // 1. Obtener sesión local
    const sesionRaw = localStorage.getItem("usuario");
    if (!sesionRaw) {
        window.location.href = "login.html";
        return;
    }
    const sesion = JSON.parse(sesionRaw);

    // 2. VERIFICACIÓN REAL DE PERMISOS (El "Filtro")
    // Consultamos a la DB si este usuario realmente tiene permiso = true
    const { data: userCheck, error: authError } = await supabase
        .from("usuarios")
        .select("permisos")
        .eq("id", sesion.id)
        .single();

    if (authError || !userCheck || userCheck.permisos !== true) {
        playNotification('error');
        Swal.fire({
            title: "Acceso Restringido",
            text: "Tu cuenta aún no ha sido autorizada por un administrador para realizar pedidos.",
            icon: "error",
            background: tema.bg,
            color: tema.txt
        });
        return;
    }

    // 3. Si tiene permiso, procedemos con el bloqueo visual
    Swal.fire({
        title: 'Procesando pedido...',
        background: tema.bg,
        color: tema.txt,
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const nombreComprador = document.getElementById("nombre").value.trim();
        const seccionComprador = seccionSelect.value;
        const nombreReceptor = document.getElementById("receptor").value.trim();
        const seccionReceptor = seccionReceptorSelect.value;
        const productoSeleccionado = document.getElementById("producto").value;

// ... dentro del try del submit ...
        const detallesOriginales = detallesInput.value.trim();

// Eliminamos la "llave" y enviamos solo el texto limpio
const { error } = await supabase.from("pedidos").insert({
    nombre_comprador: nombreComprador,
    seccion_comprador: seccionComprador,
    nombre_receptor: nombreReceptor,
    seccion_receptor: seccionReceptor,
    producto: productoSeleccionado,
    detalles: detallesOriginales,
    pagado: false,
    creado_por: sesion.username, 
    // AQUÍ EL CAMBIO: En lugar del nombre, ponemos la etiqueta de original
    ultima_edicion_por: "(Detalles originales)" 
});

if (error) throw error;

        form.reset();
        playNotification('success');
        Swal.fire({
            icon: 'success',
            title: '¡Pedido creado!',
            timer: 2000,
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt
        });

        cargarPedidos(true);

    } catch (err) {
        playNotification('error');
        Swal.fire({ title: "Error", text: "No se pudo procesar.", icon: "error" });
    }
});

/* =========================
   ⚙️ ACCIONES
========================= */
// ======== FUNCIONES DE GESTIÓN DE PEDIDOS ========
// 1. Inyección de Estilos Críticos (Para eliminar el desenfoque de los Toasts)
const style = document.createElement('style');
style.innerHTML = `
    .swal2-container.swal2-toast-shown {
        background-color: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
    }
    body.swal2-toast-shown {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
    }
    .swal2-container.swal2-toast-shown {
        pointer-events: none !important;
    }
    .swal2-toast {
        pointer-events: auto !important;
    }
`;
document.head.appendChild(style);

// 2. Funciones de Gestión
/* =========================
    ⚙️ ACCIONES ACTUALIZADAS
========================= */

window.togglePagado = async (id, estado) => {
    if (!(await verificarAccesoAdmin())) return;
    const tema = obtenerTema();

    const result = await Swal.fire({
        title: estado ? '¿Marcar como NO pagado?' : '¿Confirmar pago?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Cambiar',
        background: tema.bg,
        color: tema.txt
    });

    if (result.isConfirmed) {
        await supabase.from("pedidos").update({ pagado: !estado }).eq("id", id);
        await cargarPedidos(true);
        playNotification('success');
        
        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: '¡Estado actualizado!',
                timer: 1300,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt
            });
        }, 80);
    }
};

window.editarDetalles = async (id, actuales) => {
    if (!(await verificarAccesoAdmin())) return;
    const tema = obtenerTema();

    // 1. Obtener el nombre real de quien está sentado frente a la pantalla
    const sesionRaw = localStorage.getItem("usuario");
    let nombreEditorReal = "Usuario Desconocido";

    if (sesionRaw) {
        const objetoUsuario = JSON.parse(sesionRaw);
        nombreEditorReal = objetoUsuario.username || "Usuario";
    }

    // 2. Abrir la ventana de edición
    const { value: nuevo } = await Swal.fire({
        title: 'Editar detalles:',
        input: 'textarea',
        inputValue: actuales,
        confirmButtonColor: '#E11D48',
        background: tema.bg,
        color: tema.txt,
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
    });

    // 3. Si el usuario escribió algo y dio a "Confirmar"
    if (nuevo !== undefined && nuevo !== null) {
        // Mostramos un pequeño cargando opcional
        console.log("Actualizando pedido...", id);

        const { error } = await supabase
            .from("pedidos")
            .update({ 
                detalles: nuevo.trim(),
                // Aquí es donde cambiamos "(Detalles originales)" por tu nombre real
                ultima_edicion_por: nombreEditorReal 
            })
            .eq("id", id);

        if (error) {
            console.error("ERROR DE SUPABASE:", error.message);
            playNotification('error');
            Swal.fire({
                title: "Error",
                text: "No se pudieron guardar los cambios",
                icon: "error",
                background: tema.bg,
                color: tema.txt
            });
        } else {
            // ÉXITO
            await cargarPedidos(true);
            playNotification('success');

            // Feedback visual rápido
            Swal.fire({
                icon: 'success',
                title: 'Detalles actualizados',
                text: `Registrado por: ${nombreEditorReal}`,
                timer: 1500,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt
            });
        }
    }
};
/* =========================
    🗑️ ELIMINAR PEDIDO
========================= */
window.entregarPedido = async (id) => {
    // 1. Verificamos permisos antes de hacer nada
    if (!(await verificarAccesoAdmin())) return;
    
    const tema = obtenerTema();

    const result = await Swal.fire({
        title: '¿Eliminar pedido?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: tema.bg,
        color: tema.txt
    });

    if (result.isConfirmed) {
        try {
            const { error } = await supabase
                .from("pedidos")
                .delete()
                .eq("id", id);

            if (error) throw error;

            playNotification('delete');
            
            Swal.fire({
                title: '¡Pedido eliminado!',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt
            });

            // No hace falta recargar manualmente, el Realtime de pedidos lo hará solo
        } catch (err) {
            Swal.fire({
                title: "Error",
                text: "No se pudo eliminar el pedido.",
                icon: "error"
            });
        }
    }
};

/* =========================
   🎧 EVENTOS
========================= */
buscador.addEventListener("input", aplicarFiltros);
filtroSeccion.addEventListener("change", () => {
  paginaActual = 1;
  aplicarFiltros();
});

/* =========================
   🔴 REALTIME
========================= */
let realtimeTimeout = null;

supabase
  .channel("pedidos-realtime")
  .on(
    "postgres_changes", 
    { event: "*", schema: "public", table: "pedidos" }, 
    () => {
      // Si ya hay un temporizador corriendo, no hagas nada
      if (realtimeTimeout) return;

      // Espera 400ms antes de actualizar para no saturar
      realtimeTimeout = setTimeout(() => {
        realtimeTimeout = null;
        
        // LLAMADA CLAVE: 'true' significa silencioso
        // Actualiza la lista pero NO muestra el Loading ni suena
        cargarPedidos(true); 
      }, 400); 
    }
  )
  .subscribe();
/* =========================
   🚀 INIT
========================= */
cargarPedidos(true);
setInterval(async () => {
    const sesionRaw = localStorage.getItem("usuario");
    if (sesionRaw) {
        const sesion = JSON.parse(sesionRaw);
        const { data } = await supabase
            .from("usuarios")
            .select("permisos")
            .eq("id", sesion.id)
            .single();

        if (!data || !data.permisos) {
            console.warn("⚠️ Sesión invalidada por el servidor.");
            localStorage.clear();
            window.location.href = "login.html";
        }
    }
}, 60000); // Una vez por minuto