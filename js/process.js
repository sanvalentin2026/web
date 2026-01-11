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
                    <button onclick="editarPedidoCompleto(${p.id}, '${detallesEscapados}')">Editar</button>
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
    Swal.fire({ title: 'Procesando...', background: tema.bg, color: tema.txt, toast:true, showConfirmButton:false, allowOutsideClick: false, didOpen: () => Swal.showLoading(), position:'top', customClass: { popup: 'mi-borde-redondeado'}, });

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
        Swal.fire({ icon: 'error', text: error.message, position: 'top', showConfirmButton: false,toast:true, showConfirmButton:false, customClass: { popup: 'mi-borde-redondeado'}, timer: 2000, });
    } else {
        dom.form.reset();
        Swal.fire({ icon: 'success', title: 'Pedido Creado', timer: 2500, showConfirmButton: false,toast:true, showConfirmButton:false, background: tema.bg, color: tema.txt, position: 'top', customClass: { popup: 'mi-borde-redondeado'}, });
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
        toast:true,
        showConfirmButton:false,
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
            toast:true,
            icon: 'success',
            title: 'Pago actualizado',
            timer: 2500,
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt,
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado'},
    })
    } else {
        Swal.fire({
            toast:true,
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

window.editarPedidoCompleto = async (pedidoId) => {
    const tema = obtenerTema();

    const { data: p, error: errFetch } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single();

    if (errFetch || !p) return;

    // Lista de secciones
    const secciones = ["7-1", "7-2", "7-3", "7-4", "8-1", "8-2", "8-3", "8-4", "9-1", "9-2", "9-3", "9-4", "10-1", "10-2", "10-3", "10-4", "11-1", "11-2", "11-3", "11-4"];
    
    const opcionesSeccionC = secciones.map(s => 
        `<option value="${s}" ${p.seccion_comprador === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    const opcionesSeccionR = secciones.map(s => 
        `<option value="${s}" ${p.seccion_receptor === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    const { value: camposNuevos } = await Swal.fire({
        title: `Editar Pedido #${p.id}`,
        background: tema.bg,
        color: tema.txt,
        html: `
            <div id="form-editar-pedido" style="text-align: left; display: flex; flex-direction: column; gap: 4px; padding: 5px;">
                
                <label style="font-size: 10px; color: #E11D48; font-weight: bold; margin-left: 5px;">COMPRADOR:</label>
                <input id="swal-nombre-c" class="swal2-input" placeholder="Nombre" value="${p.nombre_comprador || ''}">
                <select id="swal-seccion-c" class="swal2-input">
                    ${opcionesSeccionC}
                </select>

                <label style="font-size: 10px; color: #E11D48; font-weight: bold; margin-top: 10px; margin-left: 5px;">RECEPTOR:</label>
                <input id="swal-nombre-r" class="swal2-input" placeholder="Nombre" value="${p.nombre_receptor || ''}">
                <select id="swal-seccion-r" class="swal2-input">
                    ${opcionesSeccionR}
                </select>

                <label style="font-size: 10px;color: #E11D48; font-weight: bold; margin-top: 10px; margin-left: 5px;">PRODUCTO Y NOTAS:</label>
                <input id="swal-producto" class="swal2-input" placeholder="Producto" value="${p.producto || ''}">
                <textarea id="swal-detalles" class="swal2-textarea" style="height: 70px;" placeholder="Detalles...">${p.detalles || ''}</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        customClass: { 
            popup: 'mi-borde-redondeado',
            input: 'custom-swal-input' // Clase extra por si acaso
        },
        preConfirm: () => {
            return {
                nombre_comprador: document.getElementById('swal-nombre-c').value.trim(),
                seccion_comprador: document.getElementById('swal-seccion-c').value,
                nombre_receptor: document.getElementById('swal-nombre-r').value.trim(),
                seccion_receptor: document.getElementById('swal-seccion-r').value,
                producto: document.getElementById('swal-producto').value.trim(),
                detalles: document.getElementById('swal-detalles').value.trim()
            }
        }
    });

    if (camposNuevos) {
        // Usar SweetAlert para la carga (Estilo solicitado en instrucciones)
        Swal.fire({
            toast: true,
            title: 'Procesando...',
            showConfirmButton:false,
            background: tema.bg,
            color: tema.txt,
            didOpen: () => Swal.showLoading(),
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado' },
        });

        const sesion = JSON.parse(localStorage.getItem("usuario"));
        const usuarioNombre = sesion ? sesion.username : "Desconocido";

        const { error } = await supabase
            .from("pedidos")
            .update({ ...camposNuevos, ultima_edicion_por: usuarioNombre })
            .eq("id", pedidoId);

        Swal.close();

        if (!error) {
            // Notificación tipo Toast (Superior y rápida)
            Swal.fire({
                icon: 'success',
                title: 'Cambios guardados',
                toast: true,
                position: 'top',
                timer: 2500,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt,
                customClass: { popup: 'mi-borde-redondeado'},
            });
            if (window.cargarPedidos) window.cargarPedidos();
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
            toast:true,
            showConfirmButton:false,
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
                toast:true,
                icon: 'success',
                title: 'Pedido eliminado',
                timer: 2500,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt,
                position: 'top',
                customClass: { popup: 'mi-borde-redondeado'},
            });
        } else {
            Swal.fire({
                toast:true,
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

    if (!datos || datos.length === 0) {
        Swal.fire({
            toast:true,
            icon: 'error',
            text: 'No hay datos para generar el PDF.',
            timer: 2500,
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt,
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado' }
        });
        return;
    }

    // --- PROCESAMIENTO DE DATOS POR DÍA ---
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const conteoPorDia = [0, 0, 0, 0, 0, 0, 0]; // Corresponde a los índices de diasSemana

    datos.forEach(p => {
        // Asumiendo que p.creado_en es la fecha de Supabase
        const fecha = new Date(p.creado_en);
        const diaIndice = fecha.getDay(); // 0 para Domingo, 1 para Lunes...
        conteoPorDia[diaIndice]++;
    });

    // Totales para las tarjetas
    const total = datos.length;
    const pagados = datos.filter(p => p.pagado).length;
    const pendientes = total - pagados;

    const ahora = new Date();
    const folioUnico = `FOL-${ahora.getTime()}`;

    const contenidoHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #1e293b; }
                .header { border-bottom: 3px solid #E11D48; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
                
                /* Layout de Estadísticas */
                .stats-container { display: flex; flex-direction: column; gap: 20px; margin-bottom: 30px; }
                .cards-row { display: flex; gap: 15px; }
                .card { 
                    flex: 1; background: #f8fafc; padding: 15px; border-radius: 10px; 
                    text-align: center; border: 1px solid #e2e8f0;
                }
                .card small { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; }
                .card div { font-size: 22px; font-weight: 900; margin-top: 5px; }

                .chart-section { background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
                .chart-container { height: 280px; width: 100%; }

                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
                th { background: #1e293b; color: white; padding: 10px; }
                td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; }
                .footer { margin-top: 40px; font-size: 9px; text-align: center; color: #94a3b8; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin:0; color:#E11D48;">REPORTE DE PEDIDOS</h1>
                <p style="margin:5px 0;">Folio: ${folioUnico} | Emitido el: ${ahora.toLocaleString()}</p>
            </div>

            <div class="stats-container">
                <div class="cards-row">
                    <div class="card"><small>Total Pedidos</small><div style="color:#1e293b;">${total}</div></div>
                    <div class="card"><small>Pagados</small><div style="color:#22c55e;">${pagados}</div></div>
                    <div class="card"><small>Pendientes</small><div style="color:#e11d48;">${pendientes}</div></div>
                </div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>DE</th>
                        <th>PARA</th>
                        <th>PRODUCTO</th>
                        <th>DETALLES</th>
                        <th>ESTADO</th>

                    </tr>
                </thead>
                <tbody>
                    ${datos.slice(0, 10).map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.nombre_comprador}</td>
                            <td>${p.nombre_receptor}</td>
                            <td>${p.producto}</td>
                            <td>${p.detalles || '- Sin detalles'}</td>
                            <td style="font-weight:bold; color: ${p.pagado ? '#16a34a' : '#dc2626'}">
                                ${p.pagado ? 'PAGADO' : 'PENDIENTE'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">Emitido por el Sistema de Control de Pedidos - Documento Privado<br>
            Cualquier edicion del documento invalidara el mismo en su totalidad.</div>

            <script>
                const ctx = document.getElementById('graficoDias').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
                        datasets: [{
                            label: 'Pedidos',
                            data: [${conteoPorDia.join(',')}],
                            backgroundColor: '#E11D48',
                            borderRadius: 5,
                            hoverBackgroundColor: '#be123c'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            </script>
        </body>
        </html>
    `;

    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(contenidoHTML);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => { document.body.removeChild(iframe); }, 2000);
    }, 1500);
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
                        console.error("La función descargarPDF no está definida.");
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
        toast: true,
        title: 'Actualización en curso',
        html: `Iniciando en: <b>${segundos}</b>s.`,
        icon: 'warning',
        position: 'top', // Alerta en la parte superior
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
    const tema = obtenerTema();
    
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
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; background:${tema.bg}; overflow: hidden; font-family: sans-serif; }
            .main { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; z-index: 10; text-align: center; color: white; }
            h1 { color: ${tema.txt}; font-size: clamp(2.5rem, 10vw, 4rem); font-weight: 900; margin: 0; letter-spacing: -2px; }
            .loader { border: 4px solid ${tema.txt}; border-left-color: #e11d48; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 25px auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
            /* Asegurar que la alerta se vea perfecta sobre el fondo */
            .swal2-container { z-index: 999999 !important; }
            .borde-personalizado { border: 2px solid #e11d48 !important; border-radius: 15px !important; }
        </style>
    </head>
    <body>
        <div class="main">
            <div>
                <h1>ACTUALIZANDO...</h1>
                <p style="color: ${tema.txt}; font-size: 1.2rem; margin-top: 10px;">Instalando: <b style="color: ${tema.txt};">${msg}</b></p>
                <div class="loader"></div>
                <p style="opacity: 0.5; font-size: 0.9rem; color:${tema.txt};">La navegación se restaurará automáticamente.</p>
                <p style="opacity: 0.5; font size: 0.9rem; color:${tema.txt};">¡Si recarga sera redirigido al login!</p>
            </div>
        </div>
    </body>
    </html>`;
}

function finalizarMantenimiento() {
    sessionStorage.removeItem("mantenimiento_visto");
    
    // 1. LECTOR DE TEMAS
    const temaGuardado = localStorage.getItem('tema') || 'oscuro'; 
    const esOscuro = temaGuardado === 'oscuro';

    // Definición estricta de colores:
    // Oscuro: Fondo casi negro, Texto blanco.
    // Claro: Fondo blanco, Texto negro/gris oscuro.
    const temaAplicado = {
        bg: esOscuro ? '#1c1c1e' : '#ffffff',
        txt: esOscuro ? '#ffffff' : '#1e293b'
    };

    let segundos = 10;

    if (typeof Swal === 'undefined') {
        window.location.reload();
        return;
    }

    // 2. APLICADOR DE ESTILOS (Sin variables de acento)
    const styleId = 'style-mantenimiento-fin';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .mi-borde-redondeado { 
                border-radius: 20px !important;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
                border: 1px solid ${esOscuro ? '#333' : '#ddd'} !important;
            }
            .swal2-container { z-index: 9999999 !important; }
            .swal2-title { font-weight: 800 !important; }
        `;
        document.head.appendChild(style);
    }

    // 3. LANZAMIENTO DE LA ALERTA
    Swal.fire({
        toast: true,
        position: 'top',
        icon: 'success',
        title: 'Terminada',
        html: `Entrando en: <b>${segundos}</b>s`,
        background: temaAplicado.bg,
        color: temaAplicado.txt,
        timer: 10000,
        showConfirmButton: false,
        customClass: {
            popup: 'mi-borde-redondeado'
        },
        didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector('b');
            const timerInterval = setInterval(() => {
                segundos--;
                if (b) b.textContent = segundos;
                if (segundos <= 0) {
                    clearInterval(timerInterval);
                    window.location.reload();
                }
            }, 1000);

            Swal.getPopup().addEventListener('click', () => clearInterval(timerInterval));
        }
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
            window.location.reload();
        }
    });
}
/* =================================================
    🔔 SISTEMA DE NOTIFICACIONES REALTIME
   ================================================= */

// Configuración de colores para el tema
const COLORES_NOTI = {
    success: '#22c55e', // Verde
    error: '#e11d48',   // Rojo
    warning: '#f59e0b', // Ámbar
    info: '#3b82f6'      // Azul
};

/**
 * Escucha la inserción de nuevas filas en la tabla 'notificaciones'
 */
async function escucharNotificaciones() {
    // Obtenemos el usuario de la sesión para filtrar mensajes privados
    const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
    const miUsuario = (sesion.username || "").trim().toLowerCase();

    supabase
        .channel('canal-notificaciones')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notificaciones' 
        }, payload => {
            const nota = payload.new;

            // Lógica de visibilidad: Para todos o para mí específicamente
            if (nota.usuario_destino === 'todos' || nota.usuario_destino.toLowerCase() === miUsuario) {
                mostrarAlertaVisual(nota);
            }
        })
        .subscribe();
}


function mostrarAlertaVisual(nota) {
    const tema = obtenerTema();
    const colorBorde = COLORES_NOTI[nota.tipo] || COLORES_NOTI.info;

    Swal.fire({
        confirmButtonText: 'Cerrar', 
        confirmButtonColor: '#e11d48',
        title: nota.titulo,
        text: nota.mensaje,
        icon: nota.tipo,
        toast: true,
        position: 'top', 
        showConfirmButton: true,
        background: tema.bg,
        color: tema.txt,    
        didOpen: (toast) => {
            toast.style.borderRadius = '20px';
            
            
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}

escucharNotificaciones();