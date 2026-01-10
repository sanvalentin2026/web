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
// COLOCAR AL PRINCIPIO ABSOLUTO DE TU ARCHIVO JS PRINCIPAL
(async function escudoProtector() {
    const { data, error } = await supabase
        .from('sistema_control')
        .select('en_mantenimiento, mensaje')
        .eq('id', 1)
        .single();

    if (data && data.en_mantenimiento) {
        // Bloqueamos la ejecución del resto del sitio
        window.stop(); 
        // Redirigimos pasando el mensaje por URL
        window.location.replace(`mantenimiento.html?msg=${encodeURIComponent(data.mensaje)}`);
    }
})();
// ESCUDO DE SEGURIDAD PRINCIPAL
(async function verificarMantenimiento() {
    // Usamos el nombre exacto de tu tabla: sistema_control
    const { data, error } = await supabase
        .from('sistema_control')
        .select('en_mantenimiento, mensaje')
        .eq('id', 1) // Tu fila es la ID 1
        .single();

    if (data && data.en_mantenimiento === true) {
        // Redirigir de inmediato si el mantenimiento está activo
        window.location.href = `mantenimiento.html?msg=${encodeURIComponent(data.mensaje)}`;
    }
})();
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

    if (!datos || datos.length === 0) {
        Swal.fire({
            icon: 'error',
            text: 'No hay datos para generar el gráfico de actividad.',
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
    setTimeout(() => {
        iniciarTutorial();
    }, 1500);
});

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



//================  MANTENIMIENTO CON TEMAS DINÁMICOS ================
// [cite: 2026-01-03, 2026-01-08]

function obtenerColoresTema() {
    const temaActual = localStorage.getItem('tema') || 'oscuro';
    const esOsc = temaActual === 'oscuro';
    return {
        bg: esOsc ? '#1c1c1e' : '#ffffff',
        txt: esOsc ? '#ffffff' : '#000000',
        accent: '#e11d48'
    };
}

// Función para aplicar estilos al DOM según el tema actual
function aplicarEstilosMantenimiento() {
    const t = obtenerColoresTema();
    let st = document.getElementById('estilo-mantenimiento-dinamico');
    
    if (!st) {
        st = document.createElement('style');
        st.id = 'estilo-mantenimiento-dinamico';
        document.head.appendChild(st);
    }
    
    st.innerHTML = `
        .mi-borde-redondeado { 
            border-radius: 20px !important; 
        }
        div:where(.swal2-container) .swal2-popup {
            background: ${t.bg} !important;
        }
        div:where(.swal2-container) .swal2-html-container, 
        div:where(.swal2-container) .swal2-title { 
            color: ${t.txt} !important; 
            font-weight: bold !important; 
        }
    `;
}

// Escuchar cambios en localStorage (por si cambias de tema en otra pestaña)
window.addEventListener('storage', (e) => {
    if (e.key === 'tema') aplicarEstilosMantenimiento();
});

async function monitorearMantenimiento() {
    aplicarEstilosMantenimiento(); // Aplicar al inicio

    const { data } = await supabase.from('sistema_control').select('*').eq('id', 1).single();

    if (data && data.en_mantenimiento) {
        window.location.replace(`mantenimiento.html?msg=${encodeURIComponent(data.mensaje)}`);
        return;
    }

    supabase.channel('global_mantenimiento')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'sistema_control',
            filter: 'id=eq.1' 
        }, (payload) => {
            if (payload.new.en_mantenimiento === true) {
                lanzarAvisoMantenimiento(payload.new.mensaje);
            }
        })
        .subscribe();
}

function lanzarAvisoMantenimiento(mensaje) {
    aplicarEstilosMantenimiento(); // Asegurar colores frescos antes de lanzar
    const t = obtenerColoresTema();
    let segundos = 10; 

    Swal.fire({
        toast: true,
        position: 'top',
        title: 'Actualización disponible',
        html: `Iniciando en: <b>${segundos}</b>s.`,
        icon: 'info',
        background: t.bg,
        color: t.txt,
        showConfirmButton: false,
        customClass: { popup: 'mi-borde-redondeado' },
        didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector('b');
            const timer = setInterval(() => {
                segundos--;
                if (b) b.textContent = segundos;
                if (segundos <= 0) {
                    clearInterval(timer);
                    window.location.replace(`mantenimiento.html?msg=${encodeURIComponent(mensaje)}`);
                }
            }, 1000);
        }
    });
}

document.addEventListener('DOMContentLoaded', monitorearMantenimiento);