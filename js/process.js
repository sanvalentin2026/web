import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

/* =========================
   🔗 CONFIGURACIÓN SUPABASE
========================= */
const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================
   📦 ESTADO GLOBAL Y DOM
========================= */
let pedidosCache = [];
let pedidosFiltrados = [];
let paginaActual = Number(sessionStorage.getItem("paginaActual")) || 1;
const PEDIDOS_POR_PAGINA = 20;

const dom = {
    form: document.getElementById("pedidoForm"),
    body: document.getElementById("pedidosBody"),
    buscador: document.getElementById("buscador"),
    filtroSeccion: document.getElementById("filtroSeccion"),
    paginacion: document.getElementById("paginacion"),
    // Inputs del formulario para crear
    nombre: document.getElementById("nombre"),
    seccion: document.getElementById("seccion"),
    receptor: document.getElementById("receptor"),
    seccion_receptor: document.getElementById("seccion_receptor"),
    producto: document.getElementById("producto"),
    detalles: document.getElementById("detalles")
};

/* =================================================
   🎨 ESTILOS PARA BOTONES DE SWEETALERT (IGUALES)
   ================================================= */
const styleSwal = document.createElement('style');
styleSwal.innerHTML = `
  /* Contenedor de los botones */
  .swal2-actions {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 12px !important;
    width: 100% !important;
    margin-top: 20px !important;
  }

  /* Forzar que ambos botones sean gemelos */
  .swal2-confirm, .swal2-cancel {
    flex: 1 !important;        /* Ambos ocupan el mismo espacio disponible */
    max-width: 140px !important; /* Límite de ancho para que no se vean gigantes */
    min-height: 45px !important; /* Altura cómoda para dedos en móvil */
    margin: 0 !important;
    padding: 10px !important;
    border-radius: 8px !important;
    font-size: 0.95rem !important;
    font-weight: 600 !important;
  }

  /* Ajuste específico para celulares muy pequeños */
  @media (max-width: 400px) {
    .swal2-actions {
      flex-direction: row !important; /* Mantenelos uno al lado del otro */
      gap: 8px !important;
    }
    .swal2-confirm, .swal2-cancel {
      font-size: 0.85rem !important;
    }
  }
`;
document.head.appendChild(styleSwal);


/* =========================
   🛠️ UTILIDADES Y SECCIONES
========================= */
const obtenerTema = () => ({
    bg: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
    txt: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151'
});

function playNotification(tipo) {
    const sonidos = { success: 'si.mp3', pago: 'applepay.mp3', delete: 'si.mp3', create: 'pedido.mp3', error: 'error.mp3' };
    new Audio(sonidos[tipo] || 'si.mp3').play().catch(() => {});
}

function inicializarSecciones() {
    const selects = [dom.seccion, dom.seccion_receptor, dom.filtroSeccion];
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = `<option value="">${select.id === 'filtroSeccion' ? 'Filtrar busqueda por seccion' : 'Seleccionar seccion'}</option>`;
        for (let i = 7; i <= 11; i++) {
            for (let j = 1; j <= 4; j++) {
                let v = `${i}-${j}`;
                select.innerHTML += `<option value="${v}">${v}</option>`;
            }
        }
    });
}

function formatFechaMobile(fechaStr) {
    if (!fechaStr) return "";
    const f = new Date(fechaStr);
    const d = f.getDate().toString().padStart(2, "0");
    const m = (f.getMonth() + 1).toString().padStart(2, "0");
    const y = f.getFullYear(); // Extraemos el año completo
    const h = f.getHours().toString().padStart(2, "0");
    const min = f.getMinutes().toString().padStart(2, "0");
    
    // Retornamos con el formato DD/MM/YYYY
    return `${d}/${m}/${y} ${h}:${min}`;
}

/* =========================
 LOGICA DE DATOS
========================= */

async function cargarPedidos(silencioso = false) {
    const { data, error } = await supabase.from("pedidos").select("*").order("id", { ascending: true });
    if (!error) {
        pedidosCache = data || [];
        aplicarFiltros();
    }
}

function aplicarFiltros() {
    const query = dom.buscador.value.toLowerCase().trim();
    const seccion = dom.filtroSeccion.value;

    pedidosFiltrados = pedidosCache.filter(p => {
        const cumpleSeccion = !seccion || p.seccion_receptor === seccion;
        const cumpleBusqueda = !query || 
            [p.nombre_comprador, p.nombre_receptor, p.producto, p.id.toString()].some(c => String(c || "").toLowerCase().includes(query));
        return cumpleSeccion && cumpleBusqueda;
    });

    renderizarTabla();
}

function renderizarTabla() {
    dom.body.innerHTML = "";
    const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
    const items = pedidosFiltrados.slice(inicio, inicio + PEDIDOS_POR_PAGINA);
    
    // Detectamos si es móvil (menos de 900px)
    const esMobile = window.innerWidth <= 900;

    items.forEach(p => {
        // Generamos el HTML de la fecha solo si es mobile
        const fechaHTML = esMobile 
            ? `<div style="font-size: 0.8rem; color: #fff; margin-bottom: 5px;">${formatFechaMobile(p.created_at)}</div>` 
            : "";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${p.id}</td>
            <td>${p.nombre_comprador} (${p.seccion_comprador})</td>
            <td>${p.nombre_receptor} (${p.seccion_receptor})</td>
            <td>${p.producto}</td>
            <td>${p.detalles || "Sin detalles"}</td>
            <td>${p.pagado ? "✅" : "❌"}</td>
            <td>
                ${fechaHTML}
                <button onclick="togglePagado(${p.id}, ${p.pagado})">Pago</button>
                <button onclick="editarDetalles(${p.id}, '${p.detalles || ""}')">Detalles</button>
                <button onclick="eliminarPedido(${p.id})">Borrar</button>
            </td>
        `;
        dom.body.appendChild(row);
    });
    renderizarPaginacion();
}

function renderizarPaginacion() {
    dom.paginacion.innerHTML = "";
    const paginas = Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA);
    if (paginas <= 1) return;

    for (let i = 1; i <= paginas; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = (i === paginaActual) ? "activa" : "";
        btn.onclick = () => { paginaActual = i; sessionStorage.setItem("paginaActual", i); renderizarTabla(); };
        dom.paginacion.appendChild(btn);
    }
}

/* =========================
   📝 CREAR PEDIDO (NUEVO)
========================= */
dom.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tema = obtenerTema();
    
    // Bloqueo visual
    Swal.fire({ title: 'Procesando...', background: tema.bg, color: tema.txt, allowOutsideClick: false, didOpen: () => Swal.showLoading(), position:'top' });

    const sesion = JSON.parse(localStorage.getItem("usuario"));
    const usuario = sesion ? sesion.username : "Desconocido";

    const nuevoPedido = {
        nombre_comprador: dom.nombre.value.trim(),
        seccion_comprador: dom.seccion.value,
        nombre_receptor: dom.receptor.value.trim(),
        seccion_receptor: dom.seccion_receptor.value,
        producto: dom.producto.value,
        detalles: dom.detalles.value.trim(),
        pagado: false,
        creado_por: usuario,         // <--- AQUÍ LO REGISTRAMOS
        ultima_edicion_por: usuario
    };

    const { error } = await supabase.from("pedidos").insert([nuevoPedido]);

    if (error) {
        Swal.fire({ icon: 'error', title: 'Error al crear', text: error.message });
    } else {
        dom.form.reset();
        playNotification('success');
        Swal.fire({ icon: 'success', title: 'Pedido Creado', timer: 1800, showConfirmButton: false, background: tema.bg, color: tema.txt, position: 'top' });
        // El Realtime actualizará la tabla solo
    }
});

/* =========================
   ⚡ ACCIONES (PAGO / EDIT / DELETE)
========================= */
window.togglePagado = async (id, estadoActual) => {
    const tema = obtenerTema(); // Obtenemos el tema para que el alert combine

    // 1. Ejecutar el cambio en Supabase
    const { error } = await supabase
        .from("pedidos")
        .update({ pagado: !estadoActual })
        .eq("id", id);
    
    if (!error) {
        // 2. Lanzar sonido de éxito/pago
        playNotification('success');

        // 3. Mostrar el SweetAlert de confirmación
        Swal.fire({
            icon: 'success',
            title: estadoActual ? 'Estado actualizado' : 'Estado actualizado',
            text: estadoActual ? 'Pedido NO pagado' : 'Pedido pagado',
            timer: 2500, // Se cierra solo en 1.5 segundos
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt,
            toast: false, // Puedes ponerlo en true si prefieres que salga como una pequeña notificación arriba
            position: 'top'
        });
        
        // No hace falta recargar la tabla manualmente, 
        // el Realtime detectará el cambio y lo hará por ti.
    } else {
        // En caso de error (ej: falta de internet)
        playNotification('error');
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el pago',
            background: tema.bg,
            color: tema.txt
        });
    }
};

window.editarDetalles = async (id, texto) => {
    const tema = obtenerTema();
    
    const { value: nuevo } = await Swal.fire({
        title: 'Editar Detalles:',
        input: 'textarea',
        inputValue: texto,
        background: tema.bg,
        color: tema.txt,
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
    });

    // Si el usuario presionó "Guardar" y el contenido no es undefined
    if (nuevo !== undefined) {
        // 1. Obtener quién edita
        const sesion = JSON.parse(localStorage.getItem("usuario"));
        const usuarioNombre = sesion ? sesion.username : "Desconocido";

        // 2. Actualizar en Supabase
        const { error } = await supabase
            .from("pedidos")
            .update({ 
                detalles: nuevo.trim(),
                ultima_edicion_por: usuarioNombre 
            })
            .eq("id", id);

        if (!error) {
            // 3. Reproducir sonido de éxito
            playNotification('success');

            // 4. 🔥 NUEVA ALERTA DE DETALLES GUARDADOS
            Swal.fire({
                icon: 'success',
                title: 'Detalles guardados',
                timer: 1700,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt,
                position: 'top'
            });
        } else {
            // Alerta en caso de error
            playNotification('error');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron guardar los cambios.',
                background: tema.bg,
                color: tema.txt,
                position: 'top'
            });
        }
    }
};

window.eliminarPedido = async (id) => {
    const tema = obtenerTema();
    
    // 1. Preguntar primero si está seguro
    const res = await Swal.fire({
        title: '¿Eliminar pedido?',
        text: "Esta acción no se puede deshacer y el registro desaparecerá.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        background: tema.bg,
        color: tema.txt
    });

    if (res.isConfirmed) {
        // 2. Mostrar carga mientras borra en la DB
        Swal.fire({
            title: 'Eliminando...',
            background: tema.bg,
            color: tema.txt,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            position: 'top'
        });

        const { error } = await supabase.from("pedidos").delete().eq("id", id);

        if (!error) {
            // 3. Confirmación final y sonido
            playNotification('delete');
            Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: 'El pedido ha sido borrado.',
                timer: 1500,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt,
                position: 'top'
            });
        } else {
            playNotification('error');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el pedido: ' + error.message,
                background: tema.bg,
                color: tema.txt,
                position: 'top'
            });
        }
    }
};

/* =========================
   🔴 REALTIME & INIT
========================= */
supabase
  .channel('pedidos-db')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
      console.log("Cambio detectado, manteniendo orden...");
      // Forzamos la recarga que ya tiene el .order("id")
      cargarPedidos(true); 
  })
  .subscribe();

dom.buscador.addEventListener("input", () => { paginaActual = 1; aplicarFiltros(); });
dom.filtroSeccion.addEventListener("change", () => { paginaActual = 1; aplicarFiltros(); });

document.addEventListener("DOMContentLoaded", () => {
    inicializarSecciones();
    cargarPedidos();
});