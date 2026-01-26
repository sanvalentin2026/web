import { verificarSesion } from './auth.js';
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

// 1. EJECUCIÓN INMEDIATA (Evita el flash blanco antes de cargar el resto)
(function() {
    const guardado = localStorage.getItem('tema-usuario') || 'modo-claro';
    document.documentElement.className = guardado;
    const color = (guardado === 'modo-oscuro') ? '#0a0a0a' : '#FFF0F6';
    document.documentElement.style.backgroundColor = color;
})();

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

// 2. CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const nombresPlurales = {
    "Alfajor": "Alfajores",
    "Fresa con chocolate": "Fresas con chocolate",
    "Ramo de fresa": "Ramos de fresas",
    "Bomba de chocolate": "Bombas de chocolate",
    "Brownie": "Brownies",
    "Galleta": "Galletas",
    "Cakepop": "Cakepops",
    "Dona": "Donas",
    "Oblea": "Obleas",
    "Flor sola": "Flores solas",
    "Ramo de 3 flores": "Ramos de 3 flores",
    "Globo": "Globos",
    "Pulsera": "Pulseras",
    "Foto con camara e impresion": "Fotos con cámara e impresión"
};

// 3. LÓGICA DE LA TABLA
async function updateTable() {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;

    const { data, error } = await supabase
        .from('productos')
        .select('nombre, stock_disponible')
        .eq('tipo', 'fisico')
        .order('nombre', { ascending: true });

    if (error) return;

    tbody.innerHTML = "";

    data.forEach(item => {
        const isOut = item.stock_disponible <= 0;
        const isLow = item.stock_disponible > 0 && item.stock_disponible < 10;
        const nombreAMostrar = nombresPlurales[item.nombre] || (item.nombre.endsWith('s') ? item.nombre : item.nombre + 's');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td title="${nombreAMostrar}">${nombreAMostrar}</td>
            <td>
                <span class="status-dot ${isOut ? 'dot-crit' : (isLow ? 'dot-warn' : 'dot-ok')}"></span>
                <span style="font-size: 0.8rem;">${isOut ? 'Agotado' : (isLow ? 'Pocas unidades' : 'Disponible')}</span>
            </td>
            <td class="col-qty">
                <span class="qty-box ${isOut ? 'out-text' : ''}">${item.stock_disponible}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. INICIALIZACIÓN Y SEGURIDAD
const inicializarPagina = async () => {
    try {
        // Validar sesión con Supabase
        await verificarSesion();
        
        // Aplicar tema al body
        const tema = localStorage.getItem('tema-usuario') || 'modo-oscuro';
        document.body.className = tema;
        document.body.style.display = 'block';
        document.body.classList.add('apple-entrance');

        // Cargar datos y suscribirse a Realtime
        await updateTable();
        
        supabase.channel('stock-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, updateTable)
            .subscribe();

        // Quitar loader después de que todo cargó
        const loader = document.getElementById('loader-global');
        setTimeout(() => {
            if (loader) loader.classList.add('loader-hidden');
        }, 1000);

    } catch (e) {
        window.location.replace("login.html");
    }
};

// Arrancar proceso
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPagina);
} else {
    inicializarPagina();
}