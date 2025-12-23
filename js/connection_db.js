import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

/* =========================
   🔗 SUPABASE
========================= */
const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


function playNotification(tipo) {
    const sonidos = {
        success: '/si.mp3', // Ruta a tu archivo
        pago: '/applepay.mp3',       // Ruta a tu archivo
        delete: '/si.mp3',    // Ruta a tu archivo
        create: '/pedido.mp3',
        error: '/error.mp3'
    };
    
    const audio = new Audio(sonidos[tipo]);
    audio.volume = 0.9;
    // El .catch evita que el código se rompa si el navegador bloquea el audio
    audio.play().catch(() => console.log("Audio bloqueado temporalmente"));
}



/* =========================
   🧠 TOKEN SAFE LAYER
========================= */
function limpiarTokenAdmin() {
  localStorage.removeItem("admin_token");
}

async function solicitarPermisoAdmin() {
  const token = localStorage.getItem("admin_token");
  if (token) return token;

  // 1. Pedir contraseña con SweetAlert (Mucho más lindo)
  const { value: password } = await Swal.fire({
    title: 'Accion restringida',
    input: 'password',
    inputLabel: 'Introduzca la contraseña para editar',
    inputPlaceholder: 'Escriba la contraseña aqui...',
    confirmButtonColor: '#E11D48',
    confirmButtonText: 'Confirmar',
    background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
    color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    }
  });

  if (!password) return null;

  // Mostramos un pequeño "Cargando..."
  Swal.fire({
    title: 'Cargando...',
    allowOutsideClick: false,
    background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
    color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151',
    didOpen: () => {
        Swal.showLoading();
    }
});

  const { data, error } = await supabase.rpc("admin_login", {
    p_password: password
  });

  // 2. Manejo de Error
  if (error || typeof data !== "string" || data.length < 10) {
    playNotification('error');
    Swal.fire({
      icon: "error",
      title: "Acceso Denegado",
      text: "La contraseña es incorrecta o hubo un fallo de conexión.",
      footer: '<a href="reportar.html" style="color: #E11D48; font-weight: bold;">Reportar un problema aquí</a>',
      confirmButtonColor: '#E11D48',
      background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
      color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151',
    });
    return null;
  }

  // 3. Éxito
  localStorage.setItem("admin_token", data);
  
  Swal.fire({
    icon: 'success',
    title: 'Acceso permitido',
    timer: 900,
    showConfirmButton: false,
    background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
    color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151'
  });

  return data;
}

async function ejecutarAdminRPC(nombreRPC, params, reintento = true) {
  let token = localStorage.getItem("admin_token");

  if (!token) {
    token = await solicitarPermisoAdmin();
    if (!token) return { error: true };
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

/* =========================
   🔄 CARGAR
========================= */
async function cargarPedidos(silencioso = false, tipoSonido = null) {
    cargandoPedidos = true;

    // A: Solo mostramos el Loading si NO es silencioso (acciones tuyas)
if (!silencioso) {
        Swal.fire({
            title: 'Cargando...',
            // Esto evita que se vea blanco antes de tiempo:
            background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
            color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151',
            allowOutsideClick: false,
            showConfirmButton: false, // Oculta el botón para que solo se vea el spinner
            didOpen: () => {
                Swal.showLoading(); // El spinner se activa dentro de la ventana ya coloreada
            }
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
                timer: 1200, // Un poco más de tiempo para que se aprecie
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
        cargarPedidos(false, 'success');

        // Notificación Toast Limpia
    }
};

window.editarDetalles = async (id, actuales) => {
    const { value: nuevo } = await Swal.fire({
        title: 'Editar detalles del pedido',
        input: 'textarea',
        inputValue: actuales,
        inputPlaceholder: 'Escriba los nuevos detalles aquí...',
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
        color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151'
    });

    if (nuevo !== undefined && nuevo !== null) {
        await ejecutarAdminRPC("admin_update_detalles", {
            p_pedido_id: id,
            p_detalles: nuevo.trim()
        });
        cargarPedidos(false, 'success');
    }
};

window.entregarPedido = async id => {
    const result = await Swal.fire({
        title: '¿Eliminar pedido?',
        text: "Esta acción borrará el pedido de la base de datos y lista principal.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
        color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151'
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
