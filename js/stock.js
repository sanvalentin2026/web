import { verificarSesion } from './auth.js';
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

// 1. EJECUCIÓN INMEDIATA: Blindaje contra el flash blanco
(function() {
    const guardado = localStorage.getItem('tema-usuario') || 'modo-claro';
    const root = document.documentElement;
    root.className = guardado;
    root.style.backgroundColor = (guardado === 'modo-oscuro') ? '#0a0a0a' : '#FFF0F6';
})();

// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const nombresPlurales = {
    "Alfajor": "Alfajores", "Fresa con chocolate": "Fresas con chocolate",
    "Ramo de fresa": "Ramos de fresas", "Bomba de chocolate": "Bombas de chocolate",
    "Brownie": "Brownies", "Galleta": "Galletas", "Cakepop": "Cakepops",
    "Dona": "Donas", "Oblea": "Obleas", "Flor sola": "Flores solas",
    "Ramo de 3 flores": "Ramos de 3 flores", "Globo": "Globos",
    "Pulsera": "Pulseras", "Foto con camara e impresion": "Fotos con cámara e impresión"
};

const tbody = document.getElementById('inventoryBody');
const loader = document.getElementById('loader-global');

// 2. ACTUALIZACIÓN DE TABLA
async function updateTable() {
    if (!tbody) return;

    try {
        const { data, error } = await supabase
            .from('productos')
            .select('nombre, stock_disponible')
            .eq('tipo', 'fisico')
            .order('nombre', { ascending: true });

        if (error) throw error;
        if (!data) return;

        const fragment = document.createDocumentFragment();

        data.forEach(item => {
            const stock = item.stock_disponible;
            const isOut = stock <= 0;
            const isLow = stock > 0 && stock < 10;
            
            const nombreBase = item.nombre;
            const nombreAMostrar = nombresPlurales[nombreBase] || 
                                   (nombreBase.endsWith('s') ? nombreBase : nombreBase + 's');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td title="${nombreAMostrar}">${nombreAMostrar}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="status-dot ${isOut ? 'dot-crit' : (isLow ? 'dot-warn' : 'dot-ok')}"></span>
                        <span style="font-size: 0.8rem; font-weight: 500;">
                            ${isOut ? 'Agotado' : (isLow ? 'Pocas unidades' : 'Disponible')}
                        </span>
                    </div>
                </td>
                <td class="col-qty">
                    <span class="qty-box ${isOut ? 'out-text' : ''}">${stock}</span>
                </td>
            `;
            fragment.appendChild(tr);
        });

        tbody.innerHTML = "";
        tbody.appendChild(fragment);
    } catch (err) {
        console.error("Error cargando inventario:", err.message);
    }
}

// 3. MODO NOCTURNO
const ModoNocturno = {
    config: {
        get auto() { return localStorage.getItem('nocturno-auto') === 'true'; },
        get intensidad() { return localStorage.getItem('nocturno-intensidad') || 40; },
        get inicio() { return localStorage.getItem('nocturno-inicio') || "19:00"; },
        get fin() { return localStorage.getItem('nocturno-fin') || "07:00"; }
    },
    aplicar() {
        if (!this.config.auto) {
            document.documentElement.style.filter = 'none';
            return;
        }
        const ahora = new Date();
        const minActual = ahora.getHours() * 60 + ahora.getMinutes();
        const [hIn, mIn] = this.config.inicio.split(':').map(Number);
        const [hFi, mFi] = this.config.fin.split(':').map(Number);
        const minIn = hIn * 60 + mIn;
        const minFi = hFi * 60 + mFi;

        const esNoche = (minIn < minFi) 
            ? (minActual >= minIn && minActual < minFi)
            : (minActual >= minIn || minActual < minFi);

        if (esNoche) {
            const f = this.config.intensidad / 100;
            const esClaro = document.documentElement.classList.contains('modo-claro');
            document.documentElement.style.filter = `sepia(${esClaro ? f * 0.6 : f * 0.8}) brightness(${esClaro ? 1 - (f / 15) : 1 - (f / 8)}) contrast(1.05)`;
        } else {
            document.documentElement.style.filter = 'none';
        }
    }
};

// 4. INICIALIZACIÓN
const inicializarPagina = async () => {
    try {
        await verificarSesion();
        await updateTable();

        const tema = localStorage.getItem('tema-usuario') || 'modo-oscuro';
        document.body.className = tema;
        document.body.style.display = 'block';
        
        supabase.channel('stock-realtime')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'productos' }, (payload) => {
                if(payload.new.tipo === 'fisico') updateTable();
            })
            .subscribe();

        ModoNocturno.aplicar();
        setInterval(() => ModoNocturno.aplicar(), 60000); 

        // 5. CIERRE DEL LOADER (Efecto Seda)
        if (loader) {
            // Forzamos la transición en JS por si el CSS no ha cargado del todo
            loader.style.transition = "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.6s";
            
            requestAnimationFrame(() => {
                loader.style.opacity = "0";
                loader.style.visibility = "hidden";
                
                loader.addEventListener('transitionend', () => {
                    loader.style.display = 'none';
                }, { once: true });
            });
        }

    } catch (e) {
        console.error("Fallo en inicialización:", e);
        window.location.replace("login.html");
    }
};

if (document.readyState === 'complete') {
    inicializarPagina();
} else {
    window.addEventListener('load', inicializarPagina);
}