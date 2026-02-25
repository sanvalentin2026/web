//seguridad
 import { verificarSesion } from './auth.js'; 

    const init = async () => {
      try {
        await verificarSesion();
        document.body.style.display = 'block';
      } catch (e) {
        window.location.replace("login.html");
      }
    };
    init();
/* =========================
   📦 ESTADO GLOBAL Y DOM
========================= */
window.pedidosCache = []; // Usamos window desde el inicio
let pedidosFiltrados = [];
let paginaActual = Number(sessionStorage.getItem("paginaActual")) || 1;
const PEDIDOS_POR_PAGINA = 10;

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
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-global');

    // Al entrar: Esperar 2 segundos y quitar loader
    setTimeout(() => {
        if (loader) {
            loader.classList.add('loader-hidden');
            // Lanzar la animación de entrada de la página
        }
    }, 400); 
});

let sonidosActivados = localStorage.getItem('sonidos-web') !== 'disabled';

const ReproductorSonidos = {
    buffer: {},
    rutas: {
        exito: 'sounds/exito.mp3',
        error: 'sounds/notificacion.mp3',
        notificacion: 'sounds/notificacion.mp3',
        eliminado: 'sounds/pop.mp3'
    },

    init() {
        for (const [nombre, ruta] of Object.entries(this.rutas)) {
            this.buffer[nombre] = new Audio(ruta);
            this.buffer[nombre].preload = 'auto';
            this.buffer[nombre].volume = 0.3;
        }
        this.actualizarUI();
    },

    play(nombre) {
        if (!sonidosActivados) return;
        const sonido = this.buffer[nombre];
        if (sonido) {
            requestAnimationFrame(() => {
                sonido.currentTime = 0;
                sonido.play().catch(() => {});
            });
        }
    },

    toggle() {
        sonidosActivados = !sonidosActivados;
        localStorage.setItem('sonidos-web', sonidosActivados ? 'enabled' : 'disabled');
        this.actualizarUI();
    },

    actualizarUI() {
        const icono = document.getElementById('iconoSonido');
        const texto = document.getElementById('textoSonido');
        if (icono && texto) {
            icono.className = sonidosActivados ? 'fas fa-volume-high' : 'fas fa-volume-xmark';
            texto.textContent = sonidosActivados ? 'Sonido Activo' : 'Silenciado';
            icono.style.color = sonidosActivados ? 'var(--primary-red)' : '#8e8e93';
        }
    }
};

ReproductorSonidos.init();

document.addEventListener('click', (e) => {
    if (e.target.closest('#btnToggleSonido')) {
        ReproductorSonidos.toggle();
    }
});

/* =========================
   🔐 UTILIDADES DE SEGURIDAD
   - escapeHTML: evita XSS al insertar texto en HTML
   - validarCampo: límites simples para proteger la DB
========================= */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function validarCampo(valor, maxLen = 500) {
    if (!valor) return '';
    const v = String(valor).trim();
    return v.length > maxLen ? v.slice(0, maxLen) : v;
}


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
        doneBtnText: 'Cerrar',
        popoverClass: 'driverjs-theme', 
        // Esta opción es clave: permite que el tutorial espere a que los elementos existan
        allowClose: false,
        steps: [
            { 
                element: '#header', 
                popover: { 
                    title: 'Bienvenido(a) al tutorial', 
                    description: 'En esta sección encontrará botones con acciones importantes como ver inventario disponible, mirar estadisticas, descargar PDF, y ver su perfil (donde encontrara configuraciones y interacciones importantes), este espacio se mantendra siempre en la parte de arriba de su pantalla.',
                    side: "bottom", align: 'center' 
                } 
            },
            { 
                element: '#pedidoForm', 
                popover: { 
                    title: 'Registro de Pedidos', 
                    description: 'Utilice este formulario rellenando todos los campos requeridos para registrar pedidos facilmente.',
                    side: "bottom", align: 'center' 
                } 
            },
            { 
                element: '.controls', 
                popover: { 
                    title: 'Búsqueda y Filtros', 
                    description: 'En esta seccion encontrara botones para buscar pedidos por sus caracteristicas(ID, Comprador, Receptor, Secciones, Producto, Estado) o bien filtrarlos por los distintos filtros de busqueda existentes.',
                    side: "top", align: 'center' 
                } 
            },
                        { 
                element: '#pedidosBody', 
                popover: { 
                    title: 'Pedidos', 
                    description: 'Aqui se mostraran todos los pedidos disponibles, todos cuentan con botones para interactuar, ademas cada 10 pedidos se creara una compaginacion en la parte inferior para no generar listas largas.',
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
const obtenerTema = () => {
    const esOscuro = document.body.classList.contains('modo-oscuro');
    
    return {
        // Modo oscuro: Gris profundo sólido | Modo claro: Blanco ultra translúcido
        bg: esOscuro ? '#1c1c1e' : '#fff',
        txt: esOscuro ? '#f5f5f7' : '#1c1c1e',
        // El blur solo existe aquí para ser usado en el modo claro
        blurEfecto: 'blur(6px) saturate(160%)' 
    };
};
function inicializarSecciones() {
    const selects = [dom.seccion, dom.seccion_receptor, dom.filtroSeccion];
    const estadosPago = ["Pendiente", "Pagado"];

    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '';

        // 1. Placeholder (Se mantiene igual)
        const placeholder = document.createElement('option');
        placeholder.value = ''; 
        placeholder.textContent = select.id === 'filtroSeccion' 
            ? 'Todos los pedidos disponibles' 
            : 'Seleccione una sección';
        select.appendChild(placeholder);

        // 2. Opciones de Pago (SOLO si es el filtro de búsqueda)
        if (select.id === 'filtroSeccion') {
            estadosPago.forEach(estado => {
                const opt = document.createElement('option');
                opt.value = estado;
                opt.textContent = `• ${estado}`;
                select.appendChild(opt);
            });

            // Separador visual solo para el filtro
            const sep = document.createElement('option');
            sep.disabled = true;
            sep.textContent = "───Secciones───";
            select.appendChild(sep);
        }

        // 3. Secciones escolares (7-1 a 11-4) - ESTO SE MANTIENE IGUAL PARA TODOS
        const optProfe = document.createElement('option');
optProfe.value = "Profes";
optProfe.textContent = "Profes";
select.appendChild(optProfe);

// 2. Mantener tus bucles originales para los niveles
for (let i = 7; i <= 11; i++) {
    for (let j = 1; j <= 4; j++) {
        let v = `${i}-${j}`;
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
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
    const { data, error } = await db.from("pedidos").select("*").order("id", { ascending: true });
    if (!error) {
        window.pedidosCache = data || [];
        aplicarFiltros();
    }
}

function aplicarFiltros() {
    const query = dom.buscador.value.toLowerCase().trim();
    const filtroValor = dom.filtroSeccion.value; 

    pedidosFiltrados = pedidosCache.filter(p => {
        // 1. Lógica de Secciones vs Estados de Pago
        let cumpleFiltroEspecial = true;

        if (filtroValor === "Pagado") {
            // Si el valor del select es "Pagado", buscamos p.pagado === true
            cumpleFiltroEspecial = (p.pagado === true);
        } else if (filtroValor === "Pendiente") {
            // Si el valor del select es "Pendiente", buscamos p.pagado === false
            cumpleFiltroEspecial = (p.pagado === false);
        } else if (filtroValor) {
            // Si es una sección (7-1, etc.)
            cumpleFiltroEspecial = p.seccion_receptor === filtroValor;
        }

        // 2. Lógica de búsqueda global (Añadí soporte para buscar "pagado" o "pendiente" en texto)
        const cumpleBusqueda = !query || [
            p.id,
            p.nombre_comprador,
            p.seccion_comprador,
            p.nombre_receptor,
            p.seccion_receptor,
            p.producto,
            p.detalles,
            p.pagado ? "pagado" : "pendiente" // Esto permite escribir "pagado" en el buscador
        ].some(c => String(c || "").toLowerCase().includes(query));
        
        return cumpleFiltroEspecial && cumpleBusqueda;
    });

    renderizarTabla();
}

function renderizarTabla() {
    const tabla = dom.body.closest('table');
    const thead = tabla ? tabla.querySelector("thead") : null;
    dom.body.innerHTML = "";

    // 1. MANEJO DE ESTADO VACÍO
    if (!pedidosFiltrados || pedidosFiltrados.length === 0) {
        if (thead) thead.style.display = "none";
        const rowVacia = document.createElement("tr");
        rowVacia.className = "fila-vacia-centrada";
        rowVacia.innerHTML = `
            <td colspan="100%">
                <div class="contenedor-vacio-dinamico">
                    <i class="fa-solid fa-box-open" style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px;"></i>
                    <h3>No se encontraron pedidos</h3>
                </div>
            </td>
        `;
        dom.body.appendChild(rowVacia);
        if (typeof renderizarPaginacion === "function") renderizarPaginacion();
        return;
    }

    if (thead) thead.style.display = "table-header-group";

    // 2. PAGINACIÓN
    const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
    const items = pedidosFiltrados.slice(inicio, inicio + PEDIDOS_POR_PAGINA);

    const fragment = document.createDocumentFragment();

    items.forEach(p => {
        const fechaTexto = p.created_at ? formatFechaMobile(p.created_at) : 'Sin fecha';
        const row = document.createElement("tr");

        // Usamos una función auxiliar interna para ahorrar código repetitivo
        const crearCelda = (label, contenido, className = "") => {
            const td = document.createElement('td');
            td.setAttribute('data-label', label);
            if (className) td.className = className;
            if (contenido instanceof HTMLElement) td.appendChild(contenido);
            else td.textContent = contenido;
            return td;
        };

        // Columnas principales
        row.appendChild(crearCelda('ID de pedido:', p.id));
        row.appendChild(crearCelda('De:', `${validarCampo(p.nombre_comprador, 100)} - (${validarCampo(p.seccion_comprador, 20)})`));
        row.appendChild(crearCelda('Para:', `${validarCampo(p.nombre_receptor, 100)} - (${validarCampo(p.seccion_receptor, 20)})`));
        row.appendChild(crearCelda('Producto:', validarCampo(p.producto, 200)));
        row.appendChild(crearCelda('Detalles:', validarCampo(p.detalles || ' - Sin detalles', 500)));

        // Columna de Estado (Badge Dinámico)
        const statusBadge = document.createElement('span');
        // Soporta tanto booleano (p.pagado) como string (p.estado)
        const estaPagado = p.pagado === true || p.estado === 'Pagado';
        
        statusBadge.className = `status-badge ${estaPagado ? 'badge-success' : 'badge-error'}`;
        statusBadge.innerHTML = estaPagado 
            ? '<i class="fa-solid fa-circle-check"></i> Pagado' 
            : '<i class="fa-solid fa-circle-xmark"></i> Pendiente';
        
        row.appendChild(crearCelda('Estado:', statusBadge));

        // Celda de Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.setAttribute('data-label', 'Acciones:');
        tdAcciones.className = 'celda-acciones';

        tdAcciones.innerHTML = `
            <div class="bloque-fecha-card">
                <span class="label-rojo">Creación:</span>
                <span class="texto-fecha">${fechaTexto}</span>
            </div>
            <div class="group-btns">
                <button class="btn-pago" onclick="window.togglePagado('${p.id}', ${estaPagado})">Estado</button>
                <button class="btn-edit" onclick="window.editarPedidoCompleto('${p.id}')">Editar</button>
                <button class="btn-del" onclick="window.eliminarPedido('${p.id}')">Eliminar</button>
            </div>
        `;

        row.appendChild(tdAcciones);
        fragment.appendChild(row);
    });

    dom.body.appendChild(fragment);
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
let nocturnoAuto = localStorage.getItem('nocturno-auto') === 'true';
let intensidadCalida = localStorage.getItem('nocturno-intensidad') || 30;
let horaInicio = localStorage.getItem('nocturno-inicio') || "19:00";
let horaFin = localStorage.getItem('nocturno-fin') || "07:00";

const ModoNocturno = {
    init() {
        const check = document.getElementById('checkModoNocturno');
        const range = document.getElementById('rangeIntensidad');
        const txtVal = document.getElementById('valIntensidad');
        const inputInicio = document.getElementById('horaInicio');
        const inputFin = document.getElementById('horaFin');

        if (check) check.checked = nocturnoAuto;
        if (range) range.value = intensidadCalida;
        if (txtVal) txtVal.textContent = intensidadCalida + "%";
        if (inputInicio) inputInicio.value = horaInicio;
        if (inputFin) inputFin.value = horaFin;

        // Listeners para cambios inmediatos sin recargar
        check?.addEventListener('change', (e) => {
            nocturnoAuto = e.target.checked;
            localStorage.setItem('nocturno-auto', nocturnoAuto);
            this.aplicar();
        });

        range?.addEventListener('input', (e) => {
            intensidadCalida = e.target.value;
            if (txtVal) txtVal.textContent = intensidadCalida + "%";
            localStorage.setItem('nocturno-intensidad', intensidadCalida);
            this.aplicar();
        });

        const actualizarHoras = () => {
            horaInicio = inputInicio.value;
            horaFin = inputFin.value;
            localStorage.setItem('nocturno-inicio', horaInicio);
            localStorage.setItem('nocturno-fin', horaFin);
            this.aplicar();
        };

        inputInicio?.addEventListener('change', actualizarHoras);
        inputFin?.addEventListener('change', actualizarHoras);

        this.aplicar();
        setInterval(() => this.aplicar(), 1000);
    },

    aplicar() {
        const ahora = new Date();
        const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
        const [hIn, mIn] = horaInicio.split(':').map(Number);
        const [hFi, mFi] = horaFin.split(':').map(Number);
        const inicioMinutos = hIn * 60 + mIn;
        const finMinutos = hFi * 60 + mFi;

        let esHoraNocturna = (inicioMinutos < finMinutos) 
            ? (horaActual >= inicioMinutos && horaActual < finMinutos)
            : (horaActual >= inicioMinutos || horaActual < finMinutos);

        const root = document.documentElement;
        const esClaro = document.body.classList.contains('modo-claro');

        if (nocturnoAuto && esHoraNocturna) {
            const factor = intensidadCalida / 100;
            const sepia = esClaro ? factor * 0.75 : factor;
            const brillo = esClaro ? 1 - (factor / 18) : 1 - (factor / 6);
            
            root.style.filter = `sepia(${sepia}) brightness(${brillo}) saturate(${esClaro ? 1.1 : 1})`;
            root.style.backgroundColor = esClaro ? '#FFF0F6' : '#000000';
            root.style.minHeight = "100vh";
        } else {
            root.style.filter = 'none';
            root.style.backgroundColor = '';
        }
    }
};

// Se inicializa al cargar
ModoNocturno.init();

/* =========================
   📝 CREAR PEDIDO (NUEVO)
========================= */
dom.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tema = obtenerTema();
    const botonEnvio = e.submitter || dom.form.querySelector('button[type="submit"]');

    // Bloqueo de seguridad contra doble clic
    if (dom.form.dataset.procesando === "true") return;
    dom.form.dataset.procesando = "true";
    if (botonEnvio) {
        botonEnvio.disabled = true;
        botonEnvio.dataset.oldText = botonEnvio.textContent;
        botonEnvio.textContent = 'Registrando...';
    }

    Swal.fire({ 
        title: 'Procesando...', 
        background: tema.bg, 
        color: tema.txt, 
        toast: true, 
        showConfirmButton: false, 
        didOpen: () => Swal.showLoading(), 
        position: 'top', 
        customClass: { popup: 'mi-borde-redondeado' }, 
    });

    try {
        const nombreVal = validarCampo(dom.nombre.value, 100);
        const receptorVal = validarCampo(dom.receptor.value, 100);
        const productoSeleccionado = validarCampo(dom.producto.value, 200);
        const detallesVal = validarCampo(dom.detalles.value, 500);

        if (!nombreVal || !receptorVal || !productoSeleccionado) {
            ReproductorSonidos.play('notificacion');
            Swal.fire({ 
                icon: 'warning', 
                text: 'Complete los campos requeridos', 
                toast: true, 
                position: 'top', 
                showConfirmButton: false, 
                timer: 2500, 
                background: tema.bg, 
                color: tema.txt, 
                customClass: { popup: 'mi-borde-redondeado' } 
            });
            return; // Salta al finally
        }

        const sesion = JSON.parse(localStorage.getItem("usuario") || 'null');
        const usuario = sesion ? sesion.username : "Desconocido";

        const { data: prodInfo, error: errorStock } = await db
            .from("productos")
            .select("*")
            .eq("nombre", productoSeleccionado)
            .single();

        if (errorStock || !prodInfo) {
            ReproductorSonidos.play('error');
            Swal.fire({ icon: 'error', text: 'Producto no encontrado en inventario, porfavor reporte sobre este error si cree que es un error', toast: true, position: 'top', showConfirmButton: false, timer: 2500, customClass: { popup: 'mi-borde-redondeado' } });
            return;
        }

        if (prodInfo.tipo === 'fisico' && prodInfo.stock_disponible <= 0) {
            ReproductorSonidos.play('error');
            Swal.fire({ 
                icon: 'warning', 
                title: 'Sin disponibilidad', 
                html: `Unidades de <strong>${productoSeleccionado}</strong> agotadas.`, 
                toast: true, 
                position: 'top', 
                showConfirmButton: false, 
                timer: 3000, 
                background: tema.bg, 
                color: tema.txt,
                customClass: { popup: 'mi-borde-redondeado' } 
            });
            return;
        }

        const nuevoPedido = {
            nombre_comprador: nombreVal,
            seccion_comprador: dom.seccion.value,
            nombre_receptor: receptorVal,
            seccion_receptor: dom.seccion_receptor.value,
            producto: productoSeleccionado,
            detalles: detallesVal,
            pagado: false,
            creado_por: usuario,
            ultima_edicion_por: usuario
        };

        const { error: errorInsert } = await db.from("pedidos").insert([nuevoPedido]);

        if (errorInsert) {
            ReproductorSonidos.play('error');
            Swal.fire({ icon: 'error', text: errorInsert.message, position: 'top', toast: true, showConfirmButton: false, timer: 2500, customClass: { popup: 'mi-borde-redondeado' } });
        } else {
            if (prodInfo.tipo === 'fisico') {
                await db
                    .from("productos")
                    .update({ stock_disponible: prodInfo.stock_disponible - 1 })
                    .eq("nombre", productoSeleccionado);
            }

            ReproductorSonidos.play('exito');
            dom.form.reset();
            Swal.fire({ 
                icon: 'success', 
                title: 'Pedido Registrado', 
                timer: 2000, 
                showConfirmButton: false, 
                toast: true, 
                background: tema.bg, 
                color: tema.txt, 
                position: 'top', 
                customClass: { popup: 'mi-borde-redondeado' }, 
            });
        }
    } catch (error) {
        console.error("Error en el proceso:", error);
        Swal.fire({ icon: 'error', text: 'Error inesperado al procesar el pedido, porfavor reintentelo o reporte sobre el problema.', ...tema });
    } finally {
        // Restaurar estado del botón y permitir nuevos envíos
        dom.form.dataset.procesando = "false";
        if (botonEnvio) {
            botonEnvio.disabled = false;
            botonEnvio.textContent = botonEnvio.dataset.oldText || 'Crear Pedido';
        }
    }
});

//limpiador
const VERSION_SISTEMA = 'RC-Definitive_edition';

const limpiarLocalStorageAntiguo = () => {
    const versionGuardada = localStorage.getItem('seenChangelogVersion');

    if (versionGuardada !== VERSION_SISTEMA) {
        // Solo estos 4 se salvan de la eliminación
        const camposAKeep = ['usuario', 'tutorialVisto', 'tema-usuario', 'foto-perfil'];
        const llavesActuales = Object.keys(localStorage);

        llavesActuales.forEach(llave => {
            if (!camposAKeep.includes(llave)) {
                localStorage.removeItem(llave);
            }
        });

        localStorage.setItem('seenChangelogVersion', VERSION_SISTEMA);
    }
};

document.addEventListener('DOMContentLoaded', limpiarLocalStorageAntiguo);





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
        didOpen: () => Swal.showLoading(),
        position: 'top',
        customClass: { popup: 'mi-borde-redondeado'},
    });

    const { error } = await db
        .from("pedidos")
        .update({ pagado: !estadoActual })
        .eq("id", id);
    
    // Cerramos el spinner antes de mostrar el resultado
    Swal.close();

    if (!error) {
            ReproductorSonidos.play('exito');
        Swal.fire({
            toast:true,
            icon: 'success',
            title: 'Estado actualizado',
            timer: 2000,
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt,
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado'},
    })
    } else {
            ReproductorSonidos.play('error');
        Swal.fire({
            toast:true,
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el pago, intentelo de nuevo, si cree que es un error porfavor reportelo.',
            showConfirmButton:false,
            timer:2500,
            position: 'top',
            ...tema,
            customClass: { popup: 'mi-borde-redondeado'},
        });
    }
};

window.editarPedidoCompleto = async (pedidoId) => {
    const tema = obtenerTema();

    // 1. Obtener datos del pedido y stock actual
    const [resPedido, resStock] = await Promise.all([
        db.from("pedidos").select("*").eq("id", pedidoId).single(),
        db.from("productos").select("nombre, stock_disponible, tipo")
    ]);

    if (resPedido.error || !resPedido.data) return;
    const p = resPedido.data;
    const inventarioActual = resStock.data || [];

    const secciones = ["Profes", "7-1", "7-2", "7-3", "7-4", "8-1", "8-2", "8-3", "8-4", "9-1", "9-2", "9-3", "9-4", "10-1", "10-2", "10-3", "10-4", "11-1", "11-2", "11-3", "11-4"];
    
    const opcionesSeccionC = secciones.map(s => 
        `<option value="${s}" ${p.seccion_comprador === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    const opcionesSeccionR = secciones.map(s => 
        `<option value="${s}" ${p.seccion_receptor === s ? 'selected' : ''}>${s}</option>`
    ).join('');

const categorias = {
    "Servicios": ["Baile", "Boda", "Kiss or Slap", "Serenata", "Aprete", "Picos", "Semana inglesa"],
    "Comida": ["Alfajor", "Alfajor cubierto", "Brownie", "Cupcakes", "Dona", "Marshmellows", "Palomitas"],
    "Flores": ["Flor sola", "Ramo de 2 flores", "Ramo de 3 flores"],
    "Fotos": ["Foto con camara", "Foto con camara e impresion", "Foto con telefono y fondo"],
    "Otros": ["Buzon de confesiones", "Globo"]
};

    const opcionesProductos = Object.entries(categorias).map(([grupo, productos]) => `
        <optgroup label="- ${grupo} -">
            ${productos.map(prod => `
                <option value="${prod}" ${prod === p.producto ? 'selected' : ''}>${prod}</option>
            `).join('')}
        </optgroup>
    `).join('');

    const { value: camposNuevos } = await Swal.fire({
        title: `Editar el pedido [${p.id}]`,
        background: tema.bg,
        color: tema.txt,
        html: `
        <div id="form-editar-pedido" style="text-align: left; display: flex; flex-direction: column; gap: 4px; padding: 5px;">
            <label style="font-size: 10px; color: #E11D48; font-weight: bold; margin-left: 5px;">COMPRADOR:</label>
            <input id="swal-nombre-c" class="swal2-input" placeholder="Nombre" value="${escapeHTML(validarCampo(p.nombre_comprador || '',100))}">
            <select id="swal-seccion-c" class="swal2-input">
                ${opcionesSeccionC}
            </select>

            <label style="font-size: 10px; color: #E11D48; font-weight: bold; margin-top: 10px; margin-left: 5px;">RECEPTOR:</label>
            <input id="swal-nombre-r" class="swal2-input" placeholder="Nombre" value="${escapeHTML(validarCampo(p.nombre_receptor || '',100))}">
            <select id="swal-seccion-r" class="swal2-input">
                ${opcionesSeccionR}
            </select>

            <label style="font-size: 10px; color: #E11D48; font-weight: bold; margin-top: 10px; margin-left: 5px;">PRODUCTO Y DETALLES:</label>
            <select id="swal-producto" class="swal2-input">
                ${opcionesProductos} 
            </select>
        
            <textarea id="swal-detalles" class="swal2-textarea" style="height: 70px;" placeholder="Detalles (opcional)">${escapeHTML(validarCampo(p.detalles || '',500))}</textarea>
        </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        customClass: { 
            popup: 'mi-borde-redondeado'
        },
        preConfirm: () => {
            const nombreC = document.getElementById('swal-nombre-c').value.trim();
            const seccionC = document.getElementById('swal-seccion-c').value;
            const nombreR = document.getElementById('swal-nombre-r').value.trim();
            const seccionR = document.getElementById('swal-seccion-r').value;
            const producto = document.getElementById('swal-producto').value;

            // VALIDACIÓN DE CAMPOS COMPLETOS
            if (!nombreC || !seccionC || !nombreR || !seccionR || !producto) {
                Swal.showValidationMessage('Por favor rellene todos los campos obligatorios.');
                return false;
            }

            // VALIDACIÓN DE STOCK AGOTADO (Solo si el producto cambió)
            if (producto !== p.producto) {
                const infoProd = inventarioActual.find(i => i.nombre === producto);
                if (infoProd && infoProd.tipo === 'fisico' && infoProd.stock_disponible <= 0) {
                    Swal.showValidationMessage(`No quedan unidades de ${producto}.`);
                    return false;
                }
            }

            return {
                nombre_comprador: nombreC,
                seccion_comprador: seccionC,
                nombre_receptor: nombreR,
                seccion_receptor: seccionR,
                producto: producto,
                detalles: document.getElementById('swal-detalles').value.trim()
            }
        }
    });

    if (camposNuevos) {
        const config = obtenerTema();
        Swal.fire({
            toast: true,
            position: 'top',
            title: 'Procesando...',
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt,
            didOpen: (popup) => {
                Swal.showLoading();
                popup.style.borderRadius = '20px';        
                if (!document.body.classList.contains('modo-oscuro')) {
                    popup.style.backdropFilter = config.blurEfecto;
                    popup.style.webkitBackdropFilter = config.blurEfecto;
                }
            }
        });

        const sesion = JSON.parse(localStorage.getItem("usuario"));
        const usuarioNombre = sesion ? sesion.username : "Desconocido";

        // --- LÓGICA DE RESTA Y SUMA EN LA DB ---
        if (camposNuevos.producto !== p.producto) {
            const prodViejo = inventarioActual.find(i => i.nombre === p.producto);
            const prodNuevo = inventarioActual.find(i => i.nombre === camposNuevos.producto);

            // 1. Devolver stock del producto anterior (Si era físico)
            if (prodViejo && prodViejo.tipo === 'fisico') {
                await db.from("productos")
                    .update({ stock_disponible: prodViejo.stock_disponible + 1 })
                    .eq("nombre", p.producto);
            }

            // 2. Restar stock del producto nuevo (Si es físico)
            if (prodNuevo && prodNuevo.tipo === 'fisico') {
                await db.from("productos")
                    .update({ stock_disponible: prodNuevo.stock_disponible - 1 })
                    .eq("nombre", camposNuevos.producto);
            }
        }

        const { error } = await db
            .from("pedidos")
            .update({ ...camposNuevos, ultima_edicion_por: usuarioNombre })
            .eq("id", pedidoId);

        Swal.close();

        if (!error) {
            ReproductorSonidos.play('exito');
            Swal.fire({
                icon: 'success',
                title: 'Cambios aplicados',
                toast: true,
                position: 'top',
                timer: 2000,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt,
                customClass: { popup: 'mi-borde-redondeado'},
            });
            if (window.cargarPedidos) window.cargarPedidos();
        } else {
            ReproductorSonidos.play('error');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                background: tema.bg,
                color: tema.txt,
                timer: 2500,
                showConfirmButton: false,
                toast: true,
                position: 'top',
                customClass: { popup: 'mi-borde-redondeado'}
            });
        }
    }
};
window.eliminarPedido = async (id) => {
    const tema = obtenerTema();

    const res = await Swal.fire({
        title: '¿Eliminar pedido?',
        text: "Esto no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff375f',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        background: tema.bg,
        color: tema.txt,
        customClass: { popup: 'mi-borde-redondeado'},
    });

    if (res.isConfirmed) {
        Swal.fire({
            toast: true,
            showConfirmButton: false,
            title: 'Procesando...',
            background: tema.bg,
            color: tema.txt,
            didOpen: () => Swal.showLoading(),
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado'},
        });

        const { error } = await db.from("pedidos").delete().eq("id", id);

        Swal.close();

        if (!error) {
            ReproductorSonidos.play('eliminado');
            Swal.fire({
                toast: true,
                icon: 'success',
                title: 'Pedido eliminado',
                timer: 2000,
                showConfirmButton: false,
                background: tema.bg,
                color: tema.txt,
                position: 'top',
                customClass: { popup: 'mi-borde-redondeado'},
            });
            if (window.cargarPedidos) window.cargarPedidos();
        } else {
            ReproductorSonidos.play('notificacion');
            Swal.fire({
                toast: true,
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar: ' + error.message + ' si cree que fue un error del sistema, porfavor reportelo.',
                showConfirmButton: false,
                timer: 2500,
                position: 'top',
                background: tema.bg,
                color: tema.txt,
                customClass: { popup: 'mi-borde-redondeado'},
            });
        }
    }
};


window.descargarPDF = function() {
    const datos = window.pedidosCache;
    const tema = obtenerTema();

    if (!datos || datos.length === 0) {
        ReproductorSonidos.play('error');
        Swal.fire({
            toast: true,
            icon: 'error',
            title: 'Aun no hay pedidos',
            timer: 2000,
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt,
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado' }
        });
        return;
    }

    const total = datos.length;
    const pagados = datos.filter(p => p.pagado).length;
    const pendientes = total - pagados;

    const ahora = new Date();
    const folioUnico = `FOL-${ahora.getTime()}`;
    
    // FIX: Forzamos el formato Día/Mes/Año usando es-ES
    const fechaEmision = ahora.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const contenidoHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1e293b; }
                .header { border-bottom: 3px solid #E11D48; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
                .stats-container { display: flex; gap: 15px; margin-bottom: 30px; }
                .card { 
                    flex: 1; background: #f8fafc; padding: 15px; border-radius: 10px; 
                    text-align: center; border: 1px solid #e2e8f0;
                }
                .card small { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; }
                .card div { font-size: 22px; font-weight: 900; margin-top: 5px; }

                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; table-layout: fixed; }
                th { background: #ff375f; color: white; padding: 10px; text-transform: uppercase; }
                td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; word-wrap: break-word; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .footer { margin-top: 40px; font-size: 9px; text-align: center; color: #94a3b8; border-top: 1px solid #eee; padding-top: 10px; }
                
                @media print {
                    .card { border: 1px solid #e2e8f0; -webkit-print-color-adjust: exact; }
                    th { background-color: #ff375f !important; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin:0; color:#E11D48;">RESPALDO DE PEDIDOS</h1>
                <p style="margin:5px 0;">Folio: ${folioUnico} | Fecha: ${fechaEmision}</p>
            </div>

            <div class="stats-container">
                <div class="card"><small>PEDIDOS TOTALES</small><div style="color:#1e293b;">${total}</div></div>
                <div class="card"><small>PAGADOS</small><div style="color:#22c55e;">${pagados}</div></div>
                <div class="card"><small>PENDIENTES</small><div style="color:#e11d48;">${pendientes}</div></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;">ID</th>
                        <th>DE</th>
                        <th>PARA</th>
                        <th>PRODUCTO</th>
                        <th>DETALLES</th>
                        <th style="width: 80px;">ESTADO</th>
                    </tr>
                </thead>
                <tbody>
                    ${datos.map(p => `
                    <tr>
                    <td>${escapeHTML(validarCampo(p.id, 20))}</td>
                    <td>
                        ${escapeHTML(validarCampo(p.nombre_comprador || '-', 100))} 
                        ${p.seccion_comprador ? `- (${escapeHTML(p.seccion_comprador)})` : ''}
                    </td>
                    <td>
                        ${escapeHTML(validarCampo(p.nombre_receptor || '-', 100))} 
                        ${p.seccion_receptor ? `- (${escapeHTML(p.seccion_receptor)})` : ''}
                    </td>
                        <td>${escapeHTML(validarCampo(p.producto || '-', 200))}</td>
                        <td>${escapeHTML(validarCampo(p.detalles || '- Sin detalles', 500))}</td>
                    <td style="font-weight:bold; color: ${p.pagado ? '#16a34a' : '#dc2626'}">
                         ${p.pagado ? 'PAGADO' : 'PENDIENTE'}
                    </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                <div class="clausula-legal">
                    Este documento es una representación íntegra y oficial de los registros contenidos en la base de datos del 
                    <strong>Sistema de Pedidos</strong>.<br> La información aquí presentada ha sido cifrada y validada al momento de su emisión.
                </div>
                <div class="advertencia-seguridad">
                    <strong>Aviso:</strong> Cualquier intento de alteración, edición parcial, manipulación de montos, nombres o estados 
                    mediante software externo o edición manual no esta permitido en este documento.<br> 
                    Dichos actos invalidan la legitimidad de este folio (<strong>${folioUnico}</strong>) y el documento en su totalidad.
                </div>
                <div class="info-emision">
                    Número de folio: ${folioUnico} | Validado por: Sistema de Pedidos.
                </div>
            </div>
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
    }, 1000);
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
                text: "Se generara un respaldo del contenido",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ff375f',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                background: tema.bg,
                color: tema.txt,
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
db
  .channel('pedidos-db')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
      console.log("Cambio detectado, el orden se mantubo.");
      // Forzamos la recarga que ya tiene el .order("id")
      cargarPedidos(true); 
  })
  .subscribe();

dom.buscador.addEventListener("input", () => { paginaActual = 1; aplicarFiltros(); });
dom.filtroSeccion.addEventListener("change", () => { paginaActual = 1; aplicarFiltros(); });
// Mejora: usamos debounce para evitar recalculos frecuentes mientras el usuario escribe
if (window.utils && dom.buscador) {
    dom.buscador.removeEventListener('input', () => {});
    dom.buscador.addEventListener('input', window.utils.debounce(() => { paginaActual = 1; aplicarFiltros(); }, 250));
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarSecciones();
      // Cambio detectado; uso debounce para evitar ráfagas
      if (window.utils && window.utils.debounce) {
          if (!window.__debouncedCargarPedidos) window.__debouncedCargarPedidos = window.utils.debounce(cargarPedidos, 400);
          window.__debouncedCargarPedidos(true);
      } else {
          cargarPedidos(true);
      }
    setTimeout(() => {
        iniciarTutorial();
    }, 1500);
});

/* =================================================
    🚀 SISTEMA DE MANTENIMIENTO PROFESIONAL v4.0
   ================================================= */
const USUARIO_ADMIN = "Alexei";

const MantisControl = {
    sus: null,
    vistoKey: "mantenimiento_visto",

    // Inicia el monitoreo en tiempo real
    init: async function() {
        if (this.sus) this.sus.unsubscribe();
        
        this.sus = db.channel('mantenimiento-realtime')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'sistema_control' 
            }, payload => {
                this.procesar(payload.new.en_mantenimiento, payload.new.mensaje);
            })
            .subscribe();

        this.verificarInicial();
    },

    verificarInicial: async function() {
        const { data } = await db.from('sistema_control').select('en_mantenimiento, mensaje').eq('id', 1).maybeSingle();
        if (data) this.procesar(data.en_mantenimiento, data.mensaje);
    },

    procesar: function(activo, mensaje) {
        const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
        const isAdmin = (sesion.username || "").trim().toLowerCase() === USUARIO_ADMIN.toLowerCase();
        const yaVisto = sessionStorage.getItem(this.vistoKey) === "true";

        if (activo && !isAdmin) {
            yaVisto ? this.bloquearPantalla(mensaje) : this.conteoRegresivo(mensaje);
        } else if (!activo && yaVisto) {
            this.liberarSistema();
        }
    },

    conteoRegresivo: function(msg) {
        const tema = obtenerTema();
        sessionStorage.setItem(this.vistoKey, "true");
        let timer = 10;

        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'warning',
            title: 'Actualización Inminente',
            html: `El sistema se detendrá en: <b>${timer}</b>s`,
            showConfirmButton: false,
            background: tema.bg,
            color: tema.txt,
            customClass: { popup: 'mi-borde-redondeado' },
            didOpen: () => {
                ReproductorSonidos.play('notificacion');
                const b = Swal.getHtmlContainer().querySelector('b');
                const interval = setInterval(() => {
                    timer--;
                    if (b) b.textContent = timer;
                    if (timer <= 0) {
                        clearInterval(interval);
                        this.bloquearPantalla(msg);
                    }
                }, 1000);
            }
        });
    },

    bloquearPantalla: function(msg) {
        window.stop();
        const tema = obtenerTema();
        const mensajeFinal = msg || "Optimizando la experiencia...";

        // Bloqueo de navegación
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = () => window.history.go(1);

        document.documentElement.innerHTML = `
        <div style="background:${tema.bg}; height:100vh; width:100vw; display:flex; align-items:center; justify-content:center; font-family:'Segoe UI',Roboto,sans-serif; color:${tema.txt}; text-align:center;">
            <div style="padding: 20px;">
                <h1 style="font-size: clamp(2rem, 8vw, 3.5rem); margin:0; font-weight:800; letter-spacing:-1px; color:#E11D48;">MANTENIMIENTO</h1>
                <p style="font-size:1.1rem; margin:15px 0; opacity:0.9;">${mensajeFinal}</p>
                <div class="spinner"></div>
                <p style="font-size:0.8rem; opacity:0.5; margin-top:30px;">La sesión se restaurará al finalizar los cambios.</p>
            </div>
            <style>
                .spinner { width: 40px; height: 40px; border: 3px solid rgba(225,29,72,0.2); border-top-color: #E11D48; border-radius: 50%; animation: s 0.8s infinite linear; margin: auto; }
                @keyframes s { to { transform: rotate(360deg); } }
                body { overflow: hidden; }
            </style>
        </div>`;
    },

    liberarSistema: function() {
        sessionStorage.removeItem(this.vistoKey);
        const tema = obtenerTema();
        let timer = 5;

        Swal.fire({
            toast: true,
            position: 'top',
            icon: 'success',
            title: '¡Sistema Restaurado!',
            html: `Reiniciando en <b>${timer}</b>s`,
            background: tema.bg,
            color: tema.txt,
            showConfirmButton: false,
            customClass: { popup: 'mi-borde-redondeado' },
            didOpen: () => {
                const b = Swal.getHtmlContainer().querySelector('b');
                const interval = setInterval(() => {
                    timer--;
                    if (b) b.textContent = timer;
                    if (timer <= 0) {
                        clearInterval(interval);
                        window.location.reload();
                    }
                }, 1000);
            }
        });
    }
};

// Iniciar monitoreo
MantisControl.init();
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

    db
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
            toast.style.borderRadius = '24px';
            
            
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}

escucharNotificaciones();