// 1. SEGURIDAD E IMPORTACIONES
import { verificarSesion } from './auth.js'; 

// 2. VARIABLES GLOBALES
const FOTO_DEFAULT = "./imgs/usuario.png";
const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
const fotoPersistente = localStorage.getItem("foto-perfil");

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

let sonidosActivados = localStorage.getItem('sonidos-web') !== 'disabled';

// 3. OBJETO REPRODUCTOR (Mejorado)
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
            texto.textContent = sonidosActivados ? 'Sonido Activo' : 'Sonido Silenciado';
            icono.style.color = sonidosActivados ? '#ff375f' : '#8e8e93';
        }
    }
};

// 4. FUNCIONES DE PERFIL Y UTILIDADES
function inicializarPerfil() {
    if (!sesion.username) return;

    const nomP = document.getElementById('nombrePerfil');
    const imgP = document.getElementById('imgPerfil');
    if(nomP) nomP.textContent = sesion.username;
    if(imgP) imgP.src = fotoPersistente || sesion.foto || FOTO_DEFAULT;
    
    const contenedor = document.getElementById('contenedorInsignias');
    if (contenedor) {
        contenedor.innerHTML = (sesion.username === "Alexei Chaves") 
            ? '<span class="insignia dev">Desarrollador</span><span class="insignia admin">Soporte</span>'
            : '<span class="insignia vendedor">Vendedor/a</span>';
    }
}

// 5. INICIALIZACIÓN ÚNICA (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', async () => {
    // Seguridad
    try {
        await verificarSesion();
        document.body.style.display = 'block';
    } catch (e) {
        window.location.replace("login.html");
    }

    // Loader
    const loader = document.getElementById('loader-global');
    setTimeout(() => {
        if (loader) loader.classList.add('loader-hidden');
    }, 200);

    // Inicializar Sonidos y Perfil
    ReproductorSonidos.init();
    inicializarPerfil();

    // Event Listener para el botón de sonido (Delegado para evitar errores)
    document.addEventListener('click', (e) => {
        if (e.target.closest('#btnToggleSonido')) {
            ReproductorSonidos.toggle();
        }
    });
    ModoNocturno.init();
});

// 6. FUNCIONES GLOBALES (Window)
window.navegarConAnimacion = function(url) {
    if (!url || window.location.href.includes(url)) return;
    document.body.classList.remove('apple-entrance');
    document.body.classList.add('page-exit');
    setTimeout(() => { window.location.href = url; }, 550);
};

window.verDetalleUsuario = function(username, foto, hora) {
    const esClaro = localStorage.getItem('tema-usuario') === 'modo-claro';
    const colorTexto = esClaro ? '#1c1c1e' : '#ffffff';
    let insigniasModal = (username === "Alexei Chaves") 
        ? '<span class="insignia dev">Desarrollador</span><span class="insignia admin">Soporte</span>'
        : '<span class="insignia vendedor">Vendedor/a</span>';

    Swal.fire({
        html: `
            <div style="padding: 10px; text-align: center;">
                <img src="${foto}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border:3px solid #ff375f; margin-bottom:15px;">
                <div style="font-size:1.5rem; font-weight:bold; color: ${colorTexto};">${username}</div>
                <div style="display:flex; justify-content:center; gap:8px; margin-top:10px;">${insigniasModal}</div>
                <div style="margin-top: 15px; font-size: 0.85rem; color: #8e8e93;">
                    <i class="fa-regular fa-clock"></i> Última actividad: ${hora}
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        background: esClaro ? '#ffffff' : '#1c1c1e',
        color: colorTexto,
        didOpen: (popup) => {
            popup.style.borderRadius = '20px';
            const closeBtn = popup.querySelector('.swal2-close');
            if (closeBtn) { closeBtn.style.boxShadow = 'none'; closeBtn.style.outline = 'none'; }
        }
    });
};

// 7. EVENTOS DE INPUTS
document.getElementById('inputFoto')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const fotoComprimida = canvas.toDataURL('image/jpeg', 0.7);
                
                document.getElementById('imgPerfil').src = fotoComprimida;
                localStorage.setItem("foto-perfil", fotoComprimida);
                ReproductorSonidos.play('exito');
                
                Swal.fire({
                    icon: 'success', title: 'Foto guardada', toast: true,
                    position: 'top', showConfirmButton: false, timer: 1500,
                    ...obtenerTema() 
                });
            };
        };
    }
});