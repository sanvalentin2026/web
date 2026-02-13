(function() {
    const guardado = localStorage.getItem('tema-usuario') || 'modo-oscuro';
    document.documentElement.className = guardado;
    document.documentElement.style.backgroundColor = (guardado === 'modo-oscuro') ? '#050505' : '#f8f9fa';
})();

import { verificarSesion } from './auth.js'; 
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let nocturnoAuto = localStorage.getItem('nocturno-auto') === 'true';
let intensidadCalida = localStorage.getItem('nocturno-intensidad') || 30;
let horaInicio = localStorage.getItem('nocturno-inicio') || "19:00";
let horaFin = localStorage.getItem('nocturno-fin') || "07:00";
let chartVentas = null;

const PRECIOS = {
    "Baile": 500, "Serenata": 300, "Kiss or Slap": 250, "Boda": 400,
    "Alfajor": 0, "Fresas con chocolate": 0, "Ramo de fresas": 0,
    "Bomba de chocolate": 0, "Brownie": 0, "Galleta": 0,
    "Cakepop": 0, "Dona": 0, "Oblea": 0, "Foto con camara e impresion": 1000, 
    "Flor sola": 0, "Ramo de 3 flores": 0, "Globo": 0, "Pulsera": 0, 
    "Buzon de confesiones": 150, "Foto con camara": 600, "Foto con telefono y fondo": 200,
};

const dom = {
    total: document.getElementById('totalRecaudado'),
    cantidad: document.getElementById('ventasPagadas'),
    estrella: document.getElementById('productoEstrella'),
    ranking: document.getElementById('rankingUsuarios'),
    root: document.documentElement
};

const ModoNocturno = {
    init() {
        const els = {
            check: document.getElementById('checkModoNocturno'),
            range: document.getElementById('rangeIntensidad'),
            txtVal: document.getElementById('valIntensidad'),
            inputInicio: document.getElementById('horaInicio'),
            inputFin: document.getElementById('horaFin')
        };
        if (els.check) els.check.checked = nocturnoAuto;
        if (els.range) els.range.value = intensidadCalida;
        if (els.txtVal) els.txtVal.textContent = intensidadCalida + "%";
        if (els.inputInicio) els.inputInicio.value = horaInicio;
        if (els.inputFin) els.inputFin.value = horaFin;

        els.check?.addEventListener('change', (e) => {
            nocturnoAuto = e.target.checked;
            localStorage.setItem('nocturno-auto', nocturnoAuto);
            this.aplicar();
        });

        els.range?.addEventListener('input', (e) => {
            intensidadCalida = e.target.value;
            if (els.txtVal) els.txtVal.textContent = intensidadCalida + "%";
            localStorage.setItem('nocturno-intensidad', intensidadCalida);
            this.aplicar();
        });

        const actualizarHoras = () => {
            horaInicio = els.inputInicio.value;
            horaFin = els.inputFin.value;
            localStorage.setItem('nocturno-inicio', horaInicio);
            localStorage.setItem('nocturno-fin', horaFin);
            this.aplicar();
        };

        els.inputInicio?.addEventListener('change', actualizarHoras);
        els.inputFin?.addEventListener('change', actualizarHoras);
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

        const esClaro = document.documentElement.classList.contains('modo-claro');
        if (nocturnoAuto && esHoraNocturna) {
            const factor = intensidadCalida / 100;
            const sepia = esClaro ? factor * 0.75 : factor;
            const brillo = esClaro ? 1 - (factor / 18) : 1 - (factor / 6);
            dom.root.style.filter = `sepia(${sepia}) brightness(${brillo}) saturate(${esClaro ? 1.1 : 1})`;
        } else {
            if (dom.root.style.filter !== 'none' && dom.root.style.filter !== '') {
                dom.root.style.filter = 'none';
            }
        }
    }
};

async function procesarEstadisticas() {
    const { data: pedidos, error } = await db.from("pedidos").select("*");
    if (error || !pedidos) return;

    let totalRecaudado = 0;
    const productosFrecuencia = {};
    const rankingUsuarios = {}; 
    const ventasSemana = new Array(7).fill(0);
    const cantidadPedidosSemana = new Array(7).fill(0);

    const preciosNorm = Object.fromEntries(
        Object.entries(PRECIOS).map(([k, v]) => [k.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), v])
    );

    pedidos.forEach(p => {
        const nombreLimpio = (p.producto || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const precioBase = preciosNorm[nombreLimpio] || 0;
        const detalles = (p.detalles || "").toLowerCase();
        
        let multi = 1;
        const matchMulti = detalles.match(/(?:x|\*)\s*(\d+)/) || detalles.match(/\b([2-9]|10)\b/);
        if (matchMulti) multi = parseInt(matchMulti[1]);

        const matchDeuda = detalles.match(/(?:debe|falta|resta|paga|solo|faltan)\s*(\d+)/);
        let montoCalculado = 0;
        const totalTeorico = precioBase * multi;

        if (p.pagado) {
            montoCalculado = totalTeorico;
        } else if (matchDeuda) {
            montoCalculado = Math.max(0, totalTeorico - parseInt(matchDeuda[1]));
        }

        const usuario = p.creado_por || "Anónimo";
        rankingUsuarios[usuario] = (rankingUsuarios[usuario] || 0) + 1;

        const fecha = new Date(p.created_at);
        if (!isNaN(fecha)) {
            const dia = fecha.getDay();
            cantidadPedidosSemana[dia]++;
            totalRecaudado += montoCalculado;
            ventasSemana[dia] += montoCalculado;
            if (p.pagado) productosFrecuencia[p.producto] = (productosFrecuencia[p.producto] || 0) + multi;
        }
    });

    if (dom.total) dom.total.textContent = `₡${totalRecaudado.toLocaleString('es-CR')}`;
    if (dom.cantidad) dom.cantidad.textContent = pedidos.length;
    
    const entriesProd = Object.entries(productosFrecuencia);
    if (dom.estrella) dom.estrella.textContent = entriesProd.length ? entriesProd.sort((a,b) => b[1]-a[1])[0][0] : "N/A";

    mostrarRanking(rankingUsuarios);
    renderizarGrafico(ventasSemana, cantidadPedidosSemana);
}

function mostrarRanking(usuariosObj) {
    if (!dom.ranking) return;
    const sorted = Object.entries(usuariosObj).sort((a, b) => b[1] - a[1]).slice(0, 3);
    dom.ranking.innerHTML = sorted.length ? "" : `<div style="color:var(--primary); font-weight:800; font-size:1.6rem;">N/A</div>`;

    sorted.forEach(([nombre, cantidad], index) => {
        const div = document.createElement('div');
        div.className = "ranking-item";
        div.style = "display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px solid rgba(128,128,128,0.1);";
        div.innerHTML = `
            <div style="flex:1; min-width:0;">
                <span style="font-weight:700; color:var(--text-main); font-size:0.95rem;">${index + 1}. ${nombre}</span>
            </div>
            <div style="text-align:right;">
                <span style="font-weight:700; color:var(--primary); font-size:16px;">${cantidad} <span style="font-weight:700; color:var(--primary); font-size:16px;">Pedidos</span></span>
            </div>`;
        dom.ranking.appendChild(div);
    });
}

function renderizarGrafico(ganancias, pedidos) {
    const canvas = document.getElementById('graficoVentas');
    if (!canvas) return;
    
    const esOscuro = document.documentElement.classList.contains('modo-oscuro');
    const colorT = esOscuro ? '#a1a1a6' : '#666';
    const colorG = esOscuro ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

    if (chartVentas) {
        chartVentas.data.datasets[0].data = ganancias;
        chartVentas.data.datasets[1].data = pedidos;
        chartVentas.options.scales.x.ticks.color = colorT;
        chartVentas.options.scales.y.ticks.color = colorT;
        chartVentas.options.scales.y.grid.color = colorG;
        chartVentas.update();
        return;
    }

    chartVentas = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            datasets: [
                { label: 'Ingresos (₡)', data: ganancias, backgroundColor: '#ff375f', borderRadius: 5, yAxisID: 'y' },
                { label: 'Cant. Pedidos', data: pedidos, backgroundColor: '#007aff', borderRadius: 5, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { 
                    type: 'linear', position: 'left', 
                    ticks: { color: colorT, callback: v => '₡'+v.toLocaleString() },
                    grid: { color: colorG }
                },
                y1: { 
                    type: 'linear', position: 'right', 
                    grid: { drawOnChartArea: false }, 
                    ticks: { 
                        color: '#007aff',
                        stepSize: 1,
                        precision: 0
                    },
                    min: 0
                },
                x: { ticks: { color: colorT }, grid: { display: false } }
            },
            plugins: { legend: { labels: { color: colorT } } }
        }
    });
}

const inicializarPagina = async () => {
    try {
        await verificarSesion();
        aplicarTema();
        await procesarEstadisticas();
        ModoNocturno.init();

        db.channel('live').on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
            clearTimeout(window.dbTimer);
            window.dbTimer = setTimeout(procesarEstadisticas, 500);
        }).subscribe();
    } catch (e) {
        window.location.replace("login.html");
    }
};

function aplicarTema() {
    const tema = localStorage.getItem('tema-usuario') || 'modo-oscuro';
    document.documentElement.className = tema;
    const esOscuro = tema === 'modo-oscuro';

    const props = esOscuro ? {
        '--bg': 'radial-gradient(circle at top, #1a1a1a 0%, #050505 100%)',
        '--card': 'rgba(28, 28, 30, 0.75)',
        '--text-main': '#f5f5f7',
        '--text-muted': '#a1a1a6'
    } : {
        '--bg': '#f8f9fa',
        '--card': 'hsl(0, 0%, 100%, 0.2)',
        '--text-main': '#333',
        '--text-muted': '#666'
    };

    Object.entries(props).forEach(([k, v]) => dom.root.style.setProperty(k, v));
    if (chartVentas) {
        const c = esOscuro ? '#a1a1a6' : '#666';
        const g = esOscuro ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
        chartVentas.options.scales.x.ticks.color = c;
        chartVentas.options.scales.y.ticks.color = c;
        chartVentas.options.scales.y.grid.color = g;
        chartVentas.update();
    }
}

window.addEventListener('storage', (e) => { if (e.key === 'tema-usuario') aplicarTema(); });

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-global');
    setTimeout(() => loader?.classList.add('loader-hidden'), 400);
});

inicializarPagina();