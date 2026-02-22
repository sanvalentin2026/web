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

window.mostrarPrecios = function() {
    Swal.fire({
        title: 'Lista de Precios',
        html: `
            <div style="text-align: left; max-height: 400px; overflow-y: auto; font-size: 0.95rem; line-height: 1.8;">
                <p style="text-align: center; font-weight: bold; color: #888; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">---- Servicios ----</p>
                
                <p><i class="fas fa-music" style="width: 25px; color: #9c27b0;"></i> <b>Bailes:</b> ₡500.</p>
                <p><i class="fas fa-ring" style="width: 25px; color: #fdd835;"></i> <b>Boda:</b> ₡400.</p>
                <p><i class="fas fa-hand-holding-heart" style="width: 25px; color: #ff5252;"></i> <b>Kiss or Slap:</b> ₡250.</p>
                <p><i class="fas fa-envelope-open-text" style="width: 25px; color: #4fc3f7;"></i> <b>Buzón de confesiones:</b> ₡300.</p>
                <p><i class="fas fa-guitar" style="width: 25px; color: #fb8c00;"></i> <b>Serenata:</b> ₡300.</p>
                <p><i class="fas fa-camera" style="width: 25px; color: #607d8b;"></i> <b>Foto con cámara:</b> ₡600.</p>
                <p><i class="fas fa-image" style="width: 25px; color: #4db6ac;"></i> <b>Foto con cámara e imprecion:</b> ₡1000.</p>
                <p><i class="fas fa-mobile-retro" style="width: 25px; color: #477571;"></i> <b>Foto con telefono y fondo:</b> ₡200.</p>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
                <p style="text-align: center; font-weight: bold; color: #888; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">---- Productos ----</p>
                
                <p><i class="fas fa-cookie" style="width: 25px; color: #795548;"></i> <b>Alfajores:</b> Precio indefinido</p>
                <p><i class="fas fa-bomb" style="width: 25px; color: #424242;"></i> <b>Bombas de chocolate:</b> Precio indefinido</p>
                <p><i class="fas fa-bread-slice" style="width: 25px; color: #a1887f;"></i> <b>Brownies:</b> Precio indefinido</p>
                <p><i class="fas fa-ice-cream" style="width: 25px; color: #f48fb1;"></i> <b>Cakepops:</b> Precio indefinido</p>
                <p><i class="fa-solid fa-utensils" style="width: 25px; color: #ffb74d;"></i> <b>Donas:</b> Precio indefinido</p>
                <p><i class="fas fa-seedling" style="width: 25px; color: #8bc34a;"></i> <b>Flores solas:</b> Precio indefinido</p>
                <p><i class="fas fa-apple-whole" style="width: 25px; color: #e91e63;"></i> <b>Fresas con chocolates:</b> Precio indefinido</p>
                <p><i class="fas fa-cookie-bite" style="width: 25px; color: #8d6e63;"></i> <b>Galletas:</b> Precio indefinido</p>
                <p><i class="fas fa-parachute-box" style="width: 25px; color: #03a9f4;"></i> <b>Globos:</b> Precio indefinido</p>
                <p><i class="fas fa-stroopwafel" style="width: 25px; color: #ffcc80;"></i> <b>Obleas:</b> Precio indefinido</p>
                <p><i class="fas fa-gem" style="width: 25px; color: #ba68c8;"></i> <b>Pulseras:</b> Precio indefinido</p>
                <p><i class="fas fa-hand-holding-heart" style="width: 25px; color: #ff8a80;"></i> <b>Ramos de 3 flores:</b> Precio indefinido</p>
                <p><i class="fas fa-leaf" style="width: 25px; color: #4caf50;"></i> <b>Ramo de fresas:</b> Precio indefinido</p>
            </div>
        `,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#E11D48',
        background: document.documentElement.classList.contains('modo-oscuro') ? '#1a1a1a' : '#fff',
        color: document.documentElement.classList.contains('modo-oscuro') ? '#fff' : '#545454'
    });
}