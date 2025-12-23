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
        document.documentElement.innerHTML = `
            <head>
                <title>Mantenimiento | San Valentín</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        margin: 0; background: ${colFondo} !important; color: ${colTexto} !important; 
                        display: flex !important; flex-direction: column; align-items: center; 
                        justify-content: center; min-height: 100vh; font-family: sans-serif; padding: 20px;
                    }
                    .neon-title { text-shadow: 0 0 15px #E11D48; font-size: clamp(1.2rem, 5vw, 2rem); text-transform: uppercase; margin-bottom: 30px; text-align: center; }
                    .countdown { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
                    .time-box { 
                        text-align: center; border: 2px solid #E11D48; padding: 15px; border-radius: 12px; 
                        min-width: 80px; background: rgba(225, 29, 72, 0.1); 
                    }
                    .time-box span { display: block; font-size: 2rem; font-weight: bold; color: ${colTexto} !important; }
                    .label { font-size: 0.7rem; color: #E11D48; margin-top: 5px; font-weight: bold; text-transform: uppercase; }
                    .btn-back { margin-top: 30px; padding: 10px 20px; border-radius: 50px; border: 1px solid #E11D48; background: transparent; color: ${colTexto}; cursor: pointer; }
                    .btn-back {text-decoration:none;}
                </style>
            </head>
            <body>
                <h1 class="neon-title">En mantenimiento</h1>
                <div class="countdown">
                    <div class="time-box"><span id="hours">00</span><div class="label">Horas</div></div>
                    <div class="time-box"><span id="minutes">00</span><div class="label">Minutos</div></div>
                    <div class="time-box"><span id="seconds">00</span><div class="label">Segundos</div></div>
                </div>
                <a href="https://google.com"<button class="btn-back">← Salir</button>
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


/* =========================
   🧠 TOKEN SAFE LAYER
========================= */
function limpiarTokenAdmin() {
  localStorage.removeItem("admin_token");
}

// Esto quita el bloqueo de audio tras el primer clic del usuario
const desbloquearAudio = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    window.removeEventListener('click', desbloquearAudio);
};
window.addEventListener('click', desbloquearAudio);

async function solicitarPermisoAdmin() {
  const token = localStorage.getItem("admin_token");
  if (token) return token;

  const tema = obtenerTema();

  // 1. Pedir contraseña con Bloqueo de clic externo
  const { value: password } = await Swal.fire({
    title: 'Acción restringida',
    input: 'password',
    inputLabel: 'Contraseña de administrador',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    confirmButtonColor: '#E11D48',
    background: tema.bg,
    color: tema.txt,
    allowOutsideClick: false, // <--- ESTO EVITA SALTAR EL LOGEO
    allowEscapeKey: false    // <--- EVITA SALIR CON LA TECLA ESC
  });

  // Si cancela, devolvemos null explícitamente
  if (!password) return null;

  // 2. Verificación Directa (Sin Spinner intermedio)
  const { data, error } = await supabase.rpc("admin_login", {
    p_password: password
  });

  if (error || typeof data !== "string" || data.length < 10) {
    playNotification('error');
    await Swal.fire({
      icon: "error",
      title: "Acceso Denegado",
      text: "Contraseña incorrecta.",
      confirmButtonColor: '#E11D48',
      background: tema.bg,
      color: tema.txt,
    });
    return null;
  }

  localStorage.setItem("admin_token", data);
  return data;
}

async function ejecutarAdminRPC(nombreRPC, params, reintento = true) {
  let token = localStorage.getItem("admin_token");

  if (!token) {
    token = await solicitarPermisoAdmin();
    // Si el usuario canceló el login, cortamos la ejecución aquí
    if (!token) return { error: "cancelado" }; 
  }

  const res = await supabase.rpc(nombreRPC, {
    ...params,
    p_token: token
  });

  if (res.error && reintento) {
    limpiarTokenAdmin();
    return ejecutarAdminRPC(nombreRPC, params, false);
  }

  return res;
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

  pedidosBody.innerHTML = "";

  if (!pedidos.length) {
    pedidosBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-pedidos">Sin pedidos para mostrar</td>
      </tr>
    `;
    return;
  }

  const esMobile = window.innerWidth <= 900;

  pedidos.forEach(p => {

    const fechaMobile = esMobile
  ? `
    <div class="campo">
      <span class="valor">${formatFechaMobile(p.created_at)}</span>
    </div>
  `
  : "";


    pedidosBody.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td>${p.nombre_comprador} (${p.seccion_comprador})</td>
        <td>${p.nombre_receptor} (${p.seccion_receptor})</td>
        <td>${p.producto}</td>
        <td>${p.detalles || "<em>Sin detalles</em>"}</td>
        <td>${p.pagado ? "✅" : "❌"}</td>

        <td>
          ${fechaMobile}
          <button onclick="togglePagado(${p.id}, ${p.pagado})">Pago</button>
          <button onclick="editarDetalles(${p.id}, \`${p.detalles || ""}\`)">Detalles</button>
          <button onclick="entregarPedido(${p.id})">Eliminar</button>
        </td>
      </tr>
    `;
  });
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
const tema = obtenerTema(); // <--- Usamos tu helper de temas

    if (!silencioso) {
        Swal.fire({
            title: 'Cargando...',
            background: tema.bg,
            color: tema.txt,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    }

    const { data } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

    pedidosCache = data || [];
    cargandoPedidos = false;
    aplicarFiltros(); // Esto renderiza la tabla

    // B: Si no es silencioso, cerramos el loading y disparamos sonido + toast
// B: Si no es silencioso, manejamos el cierre y el sonido
    if (!silencioso) {
        // 1. Si hay un sonido, lo lanzamos PRIMERO
        if (tipoSonido) playNotification(tipoSonido);

        // 2. Esperamos un momento (300ms) para que el sonido empiece fuerte
        // y el usuario note que algo terminó antes de que desaparezca el cargando
        setTimeout(() => {
            Swal.close(); 

            // 3. Mostramos la confirmación final
            const esOscuro = document.body.classList.contains('modo-oscuro');
            Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                timer: 1300, // Un poco más de tiempo para que se aprecie
                showConfirmButton: false,
                background: esOscuro ? '#1c1c1e' : '#fff',
                color: esOscuro ? '#f5f5f7' : '#374151',
                iconColor: 'green'
            });
        }, 300); // Este pequeño retraso es la clave
    }
}

/* =========================
   📝 REGISTRAR
========================= */
form.addEventListener("submit", async e => {
  e.preventDefault();

  await supabase.from("pedidos").insert({
    nombre_comprador: nombre.value,
    seccion_comprador: seccionSelect.value,
    nombre_receptor: receptor.value,
    seccion_receptor: seccionReceptorSelect.value,
    producto: producto.value,
    detalles: detallesInput.value || null,
    pagado: false
  });

  form.reset();
  cargarPedidos(false, 'success');
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
window.togglePagado = async (id, estado) => {
    const result = await Swal.fire({
        title: estado ? '¿Marcar como NO pagado?' : '¿Confirmar pago?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Cambiar',
        cancelButtonText: 'Cancelar',
        background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
        color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151'
    });

if (result.isConfirmed) {
    await supabase.from("pedidos").update({ pagado: !estado }).eq("id", id);
    await cargarPedidos(true); // Actualiza tabla sin cartel
    playNotification('success');
    
    Swal.fire({
        icon: 'success',
        title: 'Estado de pago actualizado',
        showConfirmButton: false,
        timer: 1300,
        background: obtenerTema().bg,
        color: obtenerTema().txt
    });
  }
};

window.editarDetalles = async (id, actuales) => {
    const tema = obtenerTema();
    const { value: nuevo } = await Swal.fire({
        title: 'Editar detalles:',
        input: 'textarea',
        inputValue: actuales,
        confirmButtonColor: '#E11D48',
        background: tema.bg,
        color: tema.txt,
        confirmButtonText: 'Guardar', // Texto del botón principal
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        allowOutsideClick: false
    });

if (nuevo !== undefined && nuevo !== null) {
        // Ejecutamos y guardamos el resultado
        const resultado = await ejecutarAdminRPC("admin_update_detalles", {
            p_pedido_id: id,
            p_detalles: nuevo.trim()
        });

        // SI EL RESULTADO TIENE ERROR O FUE CANCELADO, NO MOSTRAMOS ÉXITO
        if (resultado.error) return; 

        await cargarPedidos(true); 
        playNotification('success');
        Swal.fire({
            icon: 'success',
            title: '¡Detalles guardados!',
            timer: 1300,
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt
        });
    }
};

window.entregarPedido = async id => {
const result = await Swal.fire({
    title: '¿Eliminar pedido?',
    text: "Esta acción borrará el pedido por completo.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E11D48',
    cancelButtonColor: '#6e7881',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
    color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151',
    allowOutsideClick: false // Recomendado para evitar cierres accidentales
});

    if (result.isConfirmed) {
        await ejecutarAdminRPC("admin_delete_pedido", { p_pedido_id: id });
        cargarPedidos(false, 'success');
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
