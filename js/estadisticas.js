(function() {
    const guardado = localStorage.getItem('tema-usuario') || 'modo-claro';
    document.documentElement.className = guardado;
    const color = (guardado === 'modo-oscuro') ? '#1c1c1e' : '#ffffff';
    document.documentElement.style.backgroundColor = color;
})();

import { verificarSesion } from './auth.js'; 
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";


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
        setInterval(() => this.aplicar(), 30000);
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

const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const PRECIOS = {
    "Baile": 500, "Serenata": 300, "Kiss or Slap": 250, "Boda": 400,
    "Alfajor": 0, "Fresas con chocolate": 0, "Ramo de fresas": 0,
    "Bomba de chocolate": 0, "Brownie": 0, "Galleta": 0,
    "Cakepop": 0, "Dona": 0, "Oblea": 0, "Foto con camara e impresion": 1000, 
    "Flor sola": 0, "Ramo de 3 flores": 0, "Globo": 0, "Pulsera": 0, 
    "Buzon de confesiones": 150, "Foto con camara": 600, "Foto con telefono y fondo": 200,
};

let chartVentas = null;
const dom = {
    total: document.getElementById('totalRecaudado'),
    cantidad: document.getElementById('ventasPagadas'),
    estrella: document.getElementById('productoEstrella'),
    ranking: document.getElementById('rankingUsuarios'),
    root: document.documentElement
};

const inicializarPagina = async () => {
    try {
        await verificarSesion();
        document.body.style.display = 'block';
        aplicarTema();
        await procesarEstadisticas();
        
        const loader = document.getElementById('loader-global');
        if (loader) loader.classList.add('loader-hidden');

        db.channel('live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, realtimeUpdate)
            .subscribe();
    } catch (e) {
        window.location.replace("login.html");
    }
};

function aplicarTema() {
    const tema = localStorage.getItem('tema-usuario') || 'modo-oscuro';
    const esOscuro = tema === 'modo-oscuro';
    document.body.className = tema;

    if (esOscuro) {
        dom.root.style.setProperty('--bg', 'radial-gradient(circle at top, #1a1a1a 0%, #050505 100%)');
        dom.root.style.setProperty('--card', 'rgba(28, 28, 30, 0.75)');
        dom.root.style.setProperty('--text-main', '#f5f5f7');
        dom.root.style.setProperty('--text-muted', '#a1a1a6');
        dom.root.style.setProperty('--primary', '#ff375f');
    } else {
        dom.root.style.setProperty('--bg', '#f8f9fa');
        dom.root.style.setProperty('--card', '#ffffff');
        dom.root.style.setProperty('--text-main', '#333');
        dom.root.style.setProperty('--text-muted', '#666');
    }

    if (chartVentas) {
        const colorTexto = esOscuro ? '#a1a1a6' : '#666';
        const colorLineas = esOscuro ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        chartVentas.options.scales.x.ticks.color = colorTexto;
        chartVentas.options.scales.y.ticks.color = colorTexto;
        chartVentas.options.scales.x.grid.color = colorLineas;
        chartVentas.options.scales.y.grid.color = colorLineas;
        chartVentas.options.plugins.legend.labels.color = colorTexto;
        chartVentas.update();
    }
}

async function procesarEstadisticas() {
    const { data: pedidos, error } = await db
        .from("pedidos")
        .select("producto, pagado, creado_por, created_at, detalles");

    if (error || !pedidos) return;

    let totalRecaudado = 0;
    const productosFrecuencia = {};
    const rankingUsuarios = {}; 
    const ventasSemana = new Array(7).fill(0);
    const cantidadPedidosSemana = new Array(7).fill(0);

    const preciosNormalizados = {};
    for (let key in PRECIOS) {
        const keyLimpia = key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        preciosNormalizados[keyLimpia] = PRECIOS[key];
    }

    for (let i = 0; i < pedidos.length; i++) {
        const p = pedidos[i];
        const nombreProductoLimpio = (p.producto || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const precioBase = preciosNormalizados[nombreProductoLimpio] || 0;
        const texto = (p.detalles || "").toLowerCase().trim();
        
        let multi = 1;
        let deudaDetectada = false;
        let montoDeuda = 0;

        // Detectar multiplicador
        const patronSimbolo = texto.match(/(?:x|\*)\s*([2-9]|10)\b/);
        if (patronSimbolo) {
            multi = parseInt(patronSimbolo[1]);
        } else {
            const numeroSuelto = texto.match(/\b([2-9]|10)\b/);
            const esPalabraDeuda = ["debe", "falta", "resta", "pago", "abono", "faltan"].some(word => texto.includes(word));
            
            if (numeroSuelto && !esPalabraDeuda) {
                multi = parseInt(numeroSuelto[1]);
            } else {
                const palabrasUnidades = {
                    "dos": 2, "doble": 2, "tres": 3, "triple": 3, "cuatro": 4, "cinco": 5
                };
                for (const [palabra, valor] of Object.entries(palabrasUnidades)) {
                    if (new RegExp(`\\b${palabra}\\b`, 'i').test(texto)) {
                        multi = valor;
                        break;
                    }
                }
            }
        }

        // Detectar Deuda
        const patronDeuda = texto.match(/(?:debe|falta|resta|paga|solo|faltan)\s*(\d+)/);
        if (patronDeuda) {
            deudaDetectada = true;
            montoDeuda = parseInt(patronDeuda[1]);
        }

        let montoCalculado = 0;
        const totalTeorico = precioBase * multi;

        if (p.pagado) {
            montoCalculado = totalTeorico;
        } else if (deudaDetectada) {
            // Si no está pagado pero dice cuánto debe, sumamos la diferencia (el abono)
            montoCalculado = Math.max(0, totalTeorico - montoDeuda);
        } else {
            // Si no está pagado y NO especifica deuda, se asume que no ha pagado nada (0)
            montoCalculado = 0;
        }

        const usuario = p.creado_por || "Anónimo";
        rankingUsuarios[usuario] = (rankingUsuarios[usuario] || 0) + 1;

        const fecha = new Date(p.created_at);
        if (!isNaN(fecha)) {
            const dia = fecha.getDay();
            cantidadPedidosSemana[dia] += 1;
            totalRecaudado += montoCalculado;
            ventasSemana[dia] += montoCalculado;

            if (p.pagado) {
                productosFrecuencia[p.producto] = (productosFrecuencia[p.producto] || 0) + multi;
            }
        }
    }

    if (dom.total) dom.total.textContent = `₡${totalRecaudado.toLocaleString('es-CR')}`;
    if (dom.cantidad) dom.cantidad.textContent = pedidos.length;
    
    const entries = Object.entries(productosFrecuencia);
    const estrella = entries.length > 0 ? entries.reduce((a, b) => a[1] > b[1] ? a : b)[0] : "N/A";
    if (dom.estrella) dom.estrella.textContent = estrella;

    mostrarRanking(rankingUsuarios);
    renderizarGrafico(ventasSemana, cantidadPedidosSemana);
}

function mostrarRanking(usuariosObj) {
    if (!dom.ranking) return;
    dom.ranking.innerHTML = "";
    const entries = Object.entries(usuariosObj);

    if (entries.length === 0) {
        dom.ranking.innerHTML = `<div style="color:var(--primary); font-weight:800; font-size:1.4rem; text-align:left;">N/A</div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    const top3 = entries.sort((a, b) => b[1] - a[1]).slice(0, 3);

    top3.forEach(([nombre, cantidad], index) => {
        const div = document.createElement('div');
        div.style = `
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 15px 0; 
            border-bottom: 1px solid rgba(128,128,128,0.1);
            gap: 12px;
        `;
        
        const insignias = (nombre === "Alexei Chaves") 
            ? `<span style="background: #e3250c; color: white; font-size: 9px; padding: 2px 7px; border-radius: 5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;">DESARROLLADOR</span>
               <span style="background: #007bff; color: white; font-size: 9px; padding: 2px 7px; border-radius: 5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;">SOPORTE</span>`
            : `<span style="background: #28a745; color: white; font-size: 9px; padding: 2px 7px; border-radius: 5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;">VENDEDOR/A</span>`;

        const textoPedido = cantidad === 1 ? 'pedido' : 'pedidos';

        div.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0;">
                <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${index + 1}. ${nombre}
                </span>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                    ${insignias}
                </div>
            </div>
            <div style="display: flex; align-items: baseline; gap: 4px; min-width: fit-content; padding-left: 10px;">
                <span style="font-weight: 700; color: var(--primary); font-size: 1rem; line-height: 1;">${cantidad}</span>
                <span style="font-size: 0.75rem; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${textoPedido}
                </span>
            </div>
        `;
        fragment.appendChild(div);
    });

    dom.ranking.replaceChildren(fragment);
}

function renderizarGrafico(datosGanancias, datosPedidos) {
    const canvas = document.getElementById('graficoVentas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const esOscuro = document.body.classList.contains('modo-oscuro');
    const colorTexto = esOscuro ? '#a1a1a6' : '#666';
    const colorLineas = esOscuro ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    if (chartVentas) {
        chartVentas.data.datasets[0].data = datosGanancias;
        chartVentas.data.datasets[1].data = datosPedidos;
        chartVentas.update();
        return;
    }

    chartVentas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            datasets: [
                {
                    label: 'Ingresos (₡)',
                    data: datosGanancias,
                    backgroundColor: '#ff375f',
                    borderRadius: 5,
                    yAxisID: 'y'
                },
                {
                    label: 'Cant. Pedidos',
                    data: datosPedidos,
                    backgroundColor: '#007aff',
                    borderRadius: 5,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: colorTexto } } },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: { color: colorTexto, callback: v => '₡' + v.toLocaleString() },
                    grid: { color: colorLineas }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: { drawOnChartArea: false }, 
                    ticks: { color: '#007aff', stepSize: 1 }
                },
                x: { ticks: { color: colorTexto }, grid: { display: false } }
            }
        }
    });
}

let debounceTimer;
const realtimeUpdate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(procesarEstadisticas, 500);
};

window.addEventListener('storage', (e) => {
    if (e.key === 'tema-usuario') aplicarTema();
});

inicializarPagina();