import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


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

const PRECIOS = {
    "Baile": 500, "Serenata": 300, "Kiss or Slap": 250, "Boda": 400,
    "Alfajor": 500, "Fresas con chocolate": 1000, "Ramo de fresas": 5000,
    "Bomba de chocolate": 800, "Brownie": 700, "Galleta": 400,
    "Cakepop": 600, "Dona": 800, "Oblea": 1000, "Foto con camara e impresion": 1500, 
    "Flor sola": 1000, "Ramo de 3 flores": 3000, "Globo": 500, "Pulsera": 500, 
    "Buzon de confesiones": 150, "Foto con camara": 2500, "Foto con telefono y fondo": 200,
};

let chartVentas = null;
const dom = {
    total: document.getElementById('totalRecaudado'),
    cantidad: document.getElementById('ventasPagadas'),
    estrella: document.getElementById('productoEstrella'),
    ranking: document.getElementById('rankingUsuarios'),
    root: document.documentElement
};

function obtenerMultiplicador(detalles) {
    if (!detalles) return 1;
    const texto = detalles.toLowerCase().trim();
    
    // Detecta patrones como x2, x 3, *4
    const patronNumero = texto.match(/(?:x|\*)\s*(\d+)/);
    if (patronNumero) return parseInt(patronNumero[1]);

    // Detecta palabras clave comunes
    if (texto.includes("doble") || texto.includes(" dos ") || texto.startsWith("dos ") || texto.startsWith(" dos")) return 2;
    if (texto.includes("triple") || texto.includes(" tres ") || texto.startsWith("tres ") || texto.startsWith(" tres")) return 3;
    if (texto.includes("cuadruple") || texto.includes(" cuatro ") || texto.startsWith("cuatro ") || texto.startsWith(" cuatro")) return 4;
    if (texto.includes("quintuple") || texto.includes(" cinco ") || texto.startsWith("cinco ") || texto.startsWith(" cinco")) return 5;
    if (texto.includes("sextuple") || texto.includes(" seis ") || texto.startsWith("seis ") || texto.startsWith(" seis")) return 6;
    if (texto.includes("septuple") || texto.includes(" siete ") || texto.startsWith("seite ") || texto.startsWith(" siete")) return 7;
    if (texto.includes("octuple") || texto.includes(" ocho ") || texto.startsWith("ocho ") || texto.startsWith(" ocho")) return 8;
    if (texto.includes("nonuple") || texto.includes(" nueve ") || texto.startsWith("nueve ") || texto.startsWith(" nueve")) return 9;
    
    // Detecta números al inicio del texto
    const numeroInicio = texto.match(/^(\d+)\s/);
    if (numeroInicio) return parseInt(numeroInicio[1]);

    return 1;
}

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
    const { data: pedidos, error } = await supabase
        .from("pedidos")
        .select("producto, pagado, creado_por, created_at, detalles");

    if (error || !pedidos) return;

    let totalAproximado = 0;
    const productosFrecuencia = {};
    const rankingUsuarios = {}; 
    const ventasSemana = new Array(7).fill(0);
    const cantidadPedidosSemana = new Array(7).fill(0);

    const preciosNormalizados = {};
    for (let key in PRECIOS) {
        const keyLimpia = key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        preciosNormalizados[keyLimpia] = PRECIOS[key];
    }

    for (let i = 0, len = pedidos.length; i < len; i++) {
        const p = pedidos[i];
        const nombreProductoLimpio = (p.producto || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const precioBase = preciosNormalizados[nombreProductoLimpio] || 0;
        const texto = (p.detalles || "").toLowerCase().trim();
        
        let multi = 1;

        const patronSimbolo = texto.match(/(?:x|\*)\s*([2-9]|10)\b/);
        if (patronSimbolo) {
            multi = parseInt(patronSimbolo[1]);
        } else {
            const numeroSuelto = texto.match(/\b([2-9]|10)\b/);
            const esDeuda = ["debe", "paga", "falta", "vuelto"].some(word => texto.includes(word));
            
            if (numeroSuelto && !esDeuda) {
                multi = parseInt(numeroSuelto[1]);
            } else {
                const palabrasUnidades = {
                    "dos": 2, "doble": 2, "tres": 3, "triple": 3, "cuatro": 4, 
                    "cuadruple": 4, "cinco": 5, "quintuple": 5, "seis": 6, 
                    "siete": 7, "ocho": 8, "nueve": 9, "diez": 10
                };
                for (const [palabra, valor] of Object.entries(palabrasUnidades)) {
                    if (new RegExp(`\\b${palabra}\\b`, 'i').test(texto)) {
                        multi = valor;
                        break;
                    }
                }
            }
        }

        const montoCalculado = precioBase * multi;
        const usuario = p.creado_por || "Anónimo";
        
        rankingUsuarios[usuario] = (rankingUsuarios[usuario] || 0) + 1;

        const fecha = new Date(p.created_at);
        if (!isNaN(fecha)) {
            const dia = fecha.getDay();
            
            // LA CANTIDAD SE SUMA SIEMPRE (PAGADO O NO)
            cantidadPedidosSemana[dia] += multi;

            // LAS GANANCIAS SOLO SI ESTÁ PAGADO
            if (p.pagado) {
                totalAproximado += montoCalculado;
                ventasSemana[dia] += montoCalculado;
                productosFrecuencia[p.producto] = (productosFrecuencia[p.producto] || 0) + multi;
            }
        }
    }

    if (dom.total) dom.total.textContent = `₡${totalAproximado.toLocaleString('es-CR')}`;
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
        const emptyDiv = document.createElement('div');
        emptyDiv.style = "text-align: left; margin:8px; color:#ff375f; font-weight: 800; font-size: 1.4rem;";
        emptyDiv.textContent = "N/A";
        dom.ranking.appendChild(emptyDiv);
        return;
    }

    const fragment = document.createDocumentFragment();
    const top3 = entries
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    top3.forEach(([nombre, cantidad], index) => {
        const div = document.createElement('div');
        div.style = "display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;";
        
        let insignias = "";
        if (nombre === "Alexei Chaves") {
            insignias = `
                <span style="background: #007bff; color: white; font-size: 8px; padding: 2px 5px; border-radius: 4px; margin-left: 3px; font-weight: bold; text-transform: uppercase;">Soporte</span>
                <span style="background: #e3250c; color: white; font-size: 8px; padding: 2px 5px; border-radius: 4px; margin-left: 3px; font-weight: bold; text-transform: uppercase;">DESARROLLADOR</span>
            `;
        } else {
            insignias = `
                <span style="background: #28a745; color: white; font-size: 8px; padding: 2px 5px; border-radius: 4px; margin-left: 5px; font-weight: bold; text-transform: uppercase;">VENDEDOR</span>
            `;
        }

        div.innerHTML = `
            <div style="display: flex; align-items: center; flex-wrap: wrap;">
                <span style="font-weight: 500;">${index + 1}. ${nombre} - </span>
                <div style="display: flex; gap: 2px; align-items: center;">${insignias}</div>
            </div>
            <span style="font-weight: bold; color: var(--primary);">${cantidad} pedidos</span>
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
        chartVentas.update('active');
        return;
    }

    chartVentas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            datasets: [
                {
                    label: 'Ganancias (₡)',
                    data: datosGanancias,
                    backgroundColor: '#ff375f',
                    borderRadius: 5,
                    yAxisID: 'y' // Usa el eje izquierdo
                },
                {
                    label: 'Cant. Pedidos',
                    data: datosPedidos,
                    backgroundColor: '#007aff',
                    borderRadius: 5,
                    yAxisID: 'y1' // Usa el eje derecho independiente
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: colorTexto } }
            },
            scales: {
                y: { // EJE IZQUIERDO (COLONES)
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: { 
                        color: colorTexto,
                        callback: v => '₡' + v.toLocaleString() 
                    },
                    grid: { color: colorLineas }
                },
                y1: { // EJE DERECHO (CANTIDADES)
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    // Esto evita que las líneas de cuadrícula se crucen y se vea feo
                    grid: { drawOnChartArea: false }, 
                    ticks: { 
                        color: '#007aff', // Color azul para identificarlo con su barra
                        stepSize: 1 
                    }
                },
                x: { 
                    ticks: { color: colorTexto },
                    grid: { display: false }
                }
            }
        }
    });
}

let debounceTimer;
const realtimeUpdate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(procesarEstadisticas, 500);
};

document.addEventListener("DOMContentLoaded", () => {
    aplicarTema();
    procesarEstadisticas();
});

window.addEventListener('storage', (e) => {
    if (e.key === 'tema-usuario') aplicarTema();
});

supabase.channel('live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, realtimeUpdate)
    .subscribe();