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
window.pedidosCache = []; // Usamos window desde el inicio
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

// TUTORIAL

function iniciarTutorial() {
    // 1. Verificamos si ya vio el tutorial
    if (localStorage.getItem("tutorialVisto") === "true") return;

    // Verificar que Driver.js esté cargado
    if (typeof window.driver === 'undefined') {
        console.warn("Driver.js no está cargado aún.");
        return;
    }

    const driver = window.driver.js.driver;

    const driverObj = driver({
        showProgress: true,
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Finalizar tutorial',
        popoverClass: 'driverjs-theme', 
        // Esta opción es clave: permite que el tutorial espere a que los elementos existan
        allowClose: false,
        steps: [
            { 
                element: '#header', 
                popover: { 
                    title: '¡Hola! Un breve tutorial', 
                    description: 'En esta sección encontrará acciones importantes como reportar errores, descargar PDF y cambiar el tema, esta seccion lo acopañara por toda la web.',
                    side: "bottom", align: 'center' 
                } 
            },
            { 
                element: '#pedidoForm', 
                popover: { 
                    title: 'Registro de Pedidos', 
                    description: 'Utiliza este formulario para ingresar nuevos pedidos facilmente.',
                    side: "bottom", align: 'center' 
                } 
            },
            { 
                element: '.controls', 
                popover: { 
                    title: 'Búsqueda y Filtros', 
                    description: 'Su funcion es filtrar por secciones (7-1, 8-2, etc.) o busca por nombre.',
                    side: "top", align: 'center' 
                } 
            },
                        { 
                element: '#pedidosBody', 
                popover: { 
                    title: 'Pedidos', 
                    description: 'Aqui se mostraran todos los pedidos disponibles, tienen sus botones de acciones para interactuar con ellos, cada 16 pedidos se creara una compaginacion para evitar un scroll largo.',
                    side: "top", align: 'center' 
                } 
            }
        ]
    });

    driverObj.drive();
    localStorage.setItem("tutorialVisto", "true");
}



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
        select.innerHTML = `<option value="">${select.id === 'filtroSeccion' ? 'Filtrar busqueda por una seccion' : 'Seleccione una seccion'}</option>`;
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
        window.pedidosCache = data || [];
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
    // Referencia a la tabla y su cabecera para control visual total
    const tabla = dom.body.closest('table');
    const thead = tabla ? tabla.querySelector("thead") : null;
    
    dom.body.innerHTML = "";
    
    // 1. CASO SIN PEDIDOS: Limpieza total de interfaz
    if (!pedidosFiltrados || pedidosFiltrados.length === 0) {
        // Ocultamos la cabecera roja para que no estorbe el centrado
        if (thead) thead.style.display = "none";

        const rowVacia = document.createElement("tr");
        // data-label="" vacío evita que el CSS móvil inserte "ID de pedido:"
        rowVacia.innerHTML = `
            <td colspan="100%" data-label="" style="border: none !important;">
                <div class="contenedor-vacio-dinamico">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>No hay pedidos para mostrar</p>
                </div>
            </td>
        `;
        dom.body.appendChild(rowVacia);
        
        // Limpiamos paginación para que no queden botones huérfanos
        if (typeof renderizarPaginacion === "function") renderizarPaginacion();
        return;
    }

    // 2. CASO CON PEDIDOS: Restaurar estructura
    if (thead) {
        // En tablets/móvil el CSS se encargará de ocultarla si es necesario, 
        // pero aquí nos aseguramos que exista en el DOM.
        thead.style.display = "table-header-group";
    }

    const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
    const items = pedidosFiltrados.slice(inicio, inicio + PEDIDOS_POR_PAGINA);
    const esMobile = window.innerWidth <= 900;

    items.forEach(p => {
        const fechaHTML = esMobile 
            ? `<div class="fecha-dinamica">${formatFechaMobile(p.created_at)}</div>` 
            : "";

        // Escapamos comillas simples en detalles para evitar errores de sintaxis en el onclick
        const detallesEscapados = (p.detalles || "").replace(/'/g, "\\'");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td data-label="ID del pedido:">${p.id}</td>
            <td data-label="De:">${p.nombre_comprador} - (${p.seccion_comprador})</td>
            <td data-label="Para:">${p.nombre_receptor} - (${p.seccion_receptor})</td>
            <td data-label="Producto:">${p.producto}</td>
            <td data-label="Detalles:">${p.detalles || " - Sin detalles"}</td>
            <td data-label="Estado:">${p.pagado ? "✅" : "❌"}</td>
            <td data-label="Acciones:">
                ${fechaHTML}
                <div class="group-btns">
                    <button onclick="togglePagado(${p.id}, ${p.pagado})">Pago</button>
                    <button onclick="editarDetalles(${p.id}, '${detallesEscapados}')">Detalles</button>
                    <button onclick="eliminarPedido(${p.id})">Borrar</button>
                </div>
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
    Swal.fire({ title: 'Procesando pedido...', background: tema.bg, color: tema.txt, allowOutsideClick: false, didOpen: () => Swal.showLoading(), position:'top', customClass: { popup: 'mi-borde-redondeado'}, });

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
        Swal.fire({ icon: 'error', text: error.message, position: 'top', showConfirmButton: false, customClass: { popup: 'mi-borde-redondeado'}, timer: 2000, });
    } else {
        dom.form.reset();
        Swal.fire({ icon: 'success', title: 'Pedido Creado', timer: 2000, showConfirmButton: false, background: tema.bg, color: tema.txt, position: 'top', customClass: { popup: 'mi-borde-redondeado'}, });
        // El Realtime actualizará la tabla solo
    }
});

/* =========================
   ⚡ ACCIONES (PAGO / EDIT / DELETE)
========================= */
window.togglePagado = async (id, estadoActual) => {
    const tema = obtenerTema();

    // 1. Mostrar Spinner de carga de inmediato
    Swal.fire({
        title: 'Procesando...',
        background: tema.bg,
        color: tema.txt,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        position: 'top',
        customClass: { popup: 'mi-borde-redondeado'},
    });

    const { error } = await supabase
        .from("pedidos")
        .update({ pagado: !estadoActual })
        .eq("id", id);
    
    // Cerramos el spinner antes de mostrar el resultado
    Swal.close();

    if (!error) {
        Swal.fire({
            icon: 'success',
            title: 'Pago actualizado',
            timer: 2000,
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt,
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado'},
    })
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el pago',
            showConfirmButton:false,
            timer:3500,
            position: 'top',
            ...tema,
            customClass: { popup: 'mi-borde-redondeado'},
        });
    }
};

window.editarDetalles = async (id, texto) => {
    const tema = obtenerTema();
    
    const { value: nuevo } = await Swal.fire({
        title: 'Editar los detalles:',
        input: 'textarea',
        inputValue: texto,
        background: tema.bg,
        color: tema.txt,
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'mi-borde-redondeado'},
    });

    if (nuevo !== undefined) {
        // MOSTRAR CARGANDO DESPUÉS DE DAR CLIC EN GUARDAR
        Swal.fire({
            title: 'Procesando...',
            background: tema.bg,
            color: tema.txt,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado'},
        });

        const sesion = JSON.parse(localStorage.getItem("usuario"));
        const usuarioNombre = sesion ? sesion.username : "Desconocido";

        const { error } = await supabase
            .from("pedidos")
            .update({ 
                detalles: nuevo.trim(),
                ultima_edicion_por: usuarioNombre 
            })
            .eq("id", id);

        Swal.close(); // Quitar spinner

        if (!error) {
            Swal.fire({
                icon: 'success',
                title: 'Detalles guardados',
                timer: 1700,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt,
                position: 'top',
                customClass: { popup: 'mi-borde-redondeado'},
            });
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar los detalles.', ...tema, position: 'top' });
        }
    }
};

window.eliminarPedido = async (id) => {
    const tema = obtenerTema();
    
    // 1. Preguntar primero si está seguro
    const res = await Swal.fire({
        title: '¿Eliminar pedido?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        background: tema.bg,
        color: tema.txt,
        customClass: { popup: 'mi-borde-redondeado'},
    });

    if (res.isConfirmed) {
        // 2. Mostrar carga mientras borra en la DB
        Swal.fire({
            title: 'Procesando...',
            background: tema.bg,
            color: tema.txt,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado'},
        });

        const { error } = await supabase.from("pedidos").delete().eq("id", id);

        if (!error) {
            // 3. Confirmación final y sonido
            Swal.fire({
                icon: 'success',
                title: 'Pedido eliminado',
                timer: 1800,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt,
                position: 'top',
                customClass: { popup: 'mi-borde-redondeado'},
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el pedido: ' + error.message,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt,
                position: 'top',
                customClass: { popup: 'mi-borde-redondeado'},
            });
        }
    }
};


window.descargarPDF = function() {
    const datos = window.pedidosCache;
    const tema = obtenerTema();

    // 1. VALIDACIÓN CON SWEETALERT (Estilo 1.4.1)
    if (!datos || datos.length === 0) {
        Swal.fire({
            icon: 'error',
            text: 'No se pudo generar el PDF porque la lista está vacía.',
            timer: 2500,
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt,
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado' }
        });
        return; // Detiene la ejecución de forma limpia
    }

    // Generación de datos únicos en el momento del clic
    const ahora = new Date();
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).toUpperCase();
    const folioUnico = `FOL-${ahora.getTime()}-${randomHex.substring(0, 4)}`;
    
    // Formato de fecha solicitado
    const fechaEmision = ahora.toLocaleString('es-MX', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    const contenidoHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @media print { @page { margin: 10mm; } }
                body { font-family: sans-serif; padding: 20px; color: #1a1a1a; position: relative; }
                .watermark {
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 45px; color: rgba(225, 29, 72, 0.05); z-index: -1; font-weight: bold; pointer-events: none;
                }
                .header { border-bottom: 3px solid #E11D48; margin-bottom: 15px; text-align: center; }
                .resaltado { 
                    background: #fff5f7; border: 1px dashed #E11D48; padding: 12px; 
                    margin-bottom: 20px; border-radius: 8px; text-align: center; 
                }
                .status-pago { font-weight: bold; font-size: 11px; }
                table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                th { background-color: #E11D48; color: white; padding: 10px; font-size: 11px; text-transform: uppercase; }
                td { border: 1px solid #f3c1d9; padding: 8px; font-size: 10px; text-align: center; word-break: break-all; }
                .footer { margin-top: 30px; font-size: 9px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="watermark">REPORTE OFICIAL ${folioUnico}</div>
            
            <div class="header">
                <h1 style="color:#E11D48; margin:0; font-size:22px;">REPORTE DE PEDIDOS OFICIAL</h1>
            </div>

            <div class="resaltado">
                <div style="font-size: 14px; margin-bottom: 5px;">
                    <strong>FOLIO:</strong> <span style="color:#E11D48;">${folioUnico}</span>
                </div>
                <div style="font-size: 13px;">
                    <strong>EMITIDO EL:</strong> <span>${fechaEmision}</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width:35px;">ID</th>
                        <th>EMISOR</th>
                        <th>RECEPTOR</th>
                        <th>PRODUCTO</th>
                        <th style="width:25%;">DETALLES</th>
                        <th style="width:60px;">ESTADO</th>
                    </tr>
                </thead>
                <tbody>
                    ${datos.map(p => `
                        <tr>
                            <td style="font-weight:bold;">${p.id}</td>
                            <td>${p.nombre_comprador} - (${p.seccion_comprador})</td>
                            <td>${p.nombre_receptor} - (${p.seccion_receptor})</td>
                            <td>${p.producto}</td>
                            <td style="text-align:left;">${p.detalles || '- Sin detalles'}</td>
                            <td class="status-pago">${p.pagado ? 'PAGADO' : 'PENDIENTE'}</td>
                        </tr>`).join('')}
                </tbody>
            </table>

            <div class="footer">
                Este documento es un comprobante oficial emitido por el Sistema de Control de pedidos.<br>
                La integridad de este reporte se valida con el folio único de seguridad superior, cualquier <br> edicion manual invalidara en su totalidad el documento.
            </div>
        </body>
        </html>
    `;

    // Implementación mediante Iframe para máxima compatibilidad móvil
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(contenidoHTML);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 600);
};
/* =================================================
   🚀 DISPARADOR DEL RESPALDO PDF
   ================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const btnPDF = document.getElementById("btnPDF");

    if (btnPDF) {
        btnPDF.addEventListener("click", () => {
            // Usamos tu función obtenerTema() para que la alerta combine
            const tema = (typeof obtenerTema === 'function') ? obtenerTema() : { bg: '#fff', txt: '#333' };

            Swal.fire({
                title: '¿Generar PDF?',
                text: "Se descargará un documento oficial con los datos que existen actualmente.",
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#E11D48',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Descargar PDF',
                cancelButtonText: 'Cancelar',
                background: tema.bg,
                color: tema.txt,
                position: 'top', // Para que sea cómodo en móviles
                customClass: { popup: 'mi-borde-redondeado'},
            }).then((result) => {
                if (result.isConfirmed) {
                    // Llamamos a la función que ya definimos antes
                    if (typeof window.descargarPDF === 'function') {
                        window.descargarPDF();
                    } else {
                        console.error("❌ La función descargarPDF no está definida.");
                    }
                }
            });
        });
    }
});

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
    verificarBloqueoMantenimiento();
    escucharMantenimiento();
    setTimeout(() => {
        iniciarTutorial();
    }, 1500);
});

/* =================================================
    🚀 SISTEMA DE MANTENIMIENTO PROFESIONAL v4.0
   ================================================= */
const USUARIO_ADMIN = "Alexei";
const tema = obtenerTema();

// Colores del tema para las alertas

async function escucharMantenimiento() {
    supabase
        .channel('mantenimiento-realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sistema_control' }, payload => {
            procesarEstadoMantenimiento(payload.new.en_mantenimiento, payload.new.mensaje);
        })
        .subscribe();
}

async function verificarBloqueoMantenimiento() {
    const { data } = await supabase.from('sistema_control').select('en_mantenimiento, mensaje').eq('id', 1).maybeSingle();
    if (data) procesarEstadoMantenimiento(data.en_mantenimiento, data.mensaje);
}

function procesarEstadoMantenimiento(estaActivo, mensajeDB) {
    const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
    const miUsuario = (sesion.username || "").trim().toLowerCase();

    if (estaActivo === true) {
        if (miUsuario !== USUARIO_ADMIN.toLowerCase()) {
            if (sessionStorage.getItem("mantenimiento_visto") === "true") {
                aplicarPantallaMantenimiento(mensajeDB);
            } else {
                iniciarCuentaRegresiva(mensajeDB);
            }
        }
    } else {
        if (sessionStorage.getItem("mantenimiento_visto") === "true") {
            finalizarMantenimiento();
        }
    }
}

function iniciarCuentaRegresiva(mensajeDB) {
    const tema = obtenerTema();
    sessionStorage.setItem("mantenimiento_visto", "true");
    let segundos = 10;
    
    Swal.fire({
        title: 'Actualización',
        html: `Sera expulsado en: <b>${segundos}</b> segundos.`,
        icon: 'warning',
        position: 'top', // Alerta en la parte superior
        allowOutsideClick: false,
        showConfirmButton: false,
        background: tema.bg,
        color: tema.txt,
        customClass: {
            popup: 'mi-borde-redondeado'
        },
        didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector('b');
            const int = setInterval(() => {
                segundos--;
                if (b) b.textContent = segundos;
                if (segundos <= 0) {
                    clearInterval(int);
                    aplicarPantallaMantenimiento(mensajeDB);
                }
            }, 1000);
        }
    });
}

function aplicarPantallaMantenimiento(mensajeDB) {
    const msg = mensajeDB || "Mejorando el sistema...";
    window.stop();
    
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => window.history.go(1);

    document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mantenimiento en curso</title>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@5/dark.css">
        <style>
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #1c1c1e; overflow: hidden; font-family: sans-serif; }
            .main { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; z-index: 10; text-align: center; color: white; }
            h1 { color: #e11d48; font-size: clamp(2.5rem, 10vw, 4rem); font-weight: 900; margin: 0; letter-spacing: -2px; }
            .loader { border: 4px solid #1e293b; border-left-color: #e11d48; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 25px auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
            /* Asegurar que la alerta se vea perfecta sobre el fondo */
            .swal2-container { z-index: 999999 !important; }
            .borde-personalizado { border: 2px solid #e11d48 !important; border-radius: 15px !important; }
        </style>
    </head>
    <body>
        <div class="main">
            <div>
                <h1>MANTENIMIENTO</h1>
                <p style="color: #cbd5e1; font-size: 1.2rem; margin-top: 10px;">Instalando: <b style="color: white;">${msg}</b></p>
                <div class="loader"></div>
                <p style="opacity: 0.5; font-size: 0.9rem;">La navegación se restaurará automáticamente.</p>
                <p style="opacity: 0.5; font size: 0.9rem;">¡Si recarga sera redirigido al login!</p>
            </div>
        </div>
    </body>
    </html>`;
}

function finalizarMantenimiento() {
    sessionStorage.removeItem("mantenimiento_visto");
    let segundos = 10;

    // 1. Forzamos los colores manualmente (ya que obtenerTema() se borró al limpiar el DOM)
    const temaFijo = {
        bg: '#1c1c1e',
        txt: '#ffffff',
    };

    if (typeof Swal === 'undefined') {
        window.location.reload();
        return;
    }

    // 2. Inyectamos el CSS de los bordes directamente al documento actual
    const style = document.createElement('style');
    style.innerHTML = `
        .mi-borde-redondeado { 
            border-radius: 20px !important; 
        }
        .swal2-container { z-index: 9999999 !important; }
    `;
    document.head.appendChild(style);

    // 3. Lanzamos la alerta
    Swal.fire({
        title: '¡Terminado!',
        html: `Entrando en: <b>${segundos}</b> segundos...`,
        icon: 'success',
        allowOutsideClick: false,
        showConfirmButton: false,
        timerProgressBar: true,
        background: temaFijo.bg,
        color: temaFijo.txt,
        position: 'top',
        customClass: {
            popup: 'mi-borde-redondeado'
        },
        didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector('b');
            const int = setInterval(() => {
                segundos--;
                if (b) b.textContent = segundos;
                if (segundos <= 0) {
                    clearInterval(int);
                    window.location.reload();
                }
            }, 1000);
        }
    });
}