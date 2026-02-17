// 1. SEGURIDAD E IMPORTACIONES
import { verificarSesion } from './auth.js'; 

// 2. CONSTANTES Y ESTADO INICIAL
const FOTO_DEFAULT = "./imgs/usuario.png";
const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");
const fotoPersistente = localStorage.getItem("foto-perfil");

// Cache de elementos del DOM frecuentes
const dom = {
    root: document.documentElement,
    body: document.body,
    imgPerfil: document.getElementById('imgPerfil'),
    nomPerfil: document.getElementById('nombrePerfil'),
    contInsignias: document.getElementById('contenedorInsignias'),
    loader: document.getElementById('loader-global')
};

// 3. MODO NOCTURNO (Optimizado: Check cada 30s)
const ModoNocturno = {
    config: {
        auto: localStorage.getItem('nocturno-auto') === 'true',
        intensidad: localStorage.getItem('nocturno-intensidad') || 30,
        inicio: localStorage.getItem('nocturno-inicio') || "19:00",
        fin: localStorage.getItem('nocturno-fin') || "07:00"
    },
    init() {
        const ids = ['checkModoNocturno', 'rangeIntensidad', 'valIntensidad', 'horaInicio', 'horaFin'];
        const el = {};
        ids.forEach(id => el[id] = document.getElementById(id));

        if (el.checkModoNocturno) el.checkModoNocturno.checked = this.config.auto;
        if (el.rangeIntensidad) el.rangeIntensidad.value = this.config.intensidad;
        if (el.valIntensidad) el.valIntensidad.textContent = this.config.intensidad + "%";
        if (el.horaInicio) el.horaInicio.value = this.config.inicio;
        if (el.horaFin) el.horaFin.value = this.config.fin;

        el.checkModoNocturno?.addEventListener('change', (e) => {
            this.config.auto = e.target.checked;
            localStorage.setItem('nocturno-auto', this.config.auto);
            this.aplicar();
        });

        el.rangeIntensidad?.addEventListener('input', (e) => {
            this.config.intensidad = e.target.value;
            if (el.valIntensidad) el.valIntensidad.textContent = this.config.intensidad + "%";
            localStorage.setItem('nocturno-intensidad', this.config.intensidad);
            this.aplicar();
        });

        const updateH = () => {
            this.config.inicio = el.horaInicio.value;
            this.config.fin = el.horaFin.value;
            localStorage.setItem('nocturno-inicio', this.config.inicio);
            localStorage.setItem('nocturno-fin', this.config.fin);
            this.aplicar();
        };

        el.horaInicio?.addEventListener('change', updateH);
        el.horaFin?.addEventListener('change', updateH);

        this.aplicar();
        setInterval(() => this.aplicar(), 30000); 
    },
    aplicar() {
        if (!this.config.auto) {
            dom.root.style.filter = 'none';
            return;
        }
        const ahora = new Date();
        const minAct = ahora.getHours() * 60 + ahora.getMinutes();
        const [hIn, mIn] = this.config.inicio.split(':').map(Number);
        const [hFi, mFi] = this.config.fin.split(':').map(Number);
        const minIn = hIn * 60 + mIn, minFi = hFi * 60 + mFi;

        const esNoche = (minIn < minFi) ? (minAct >= minIn && minAct < minFi) : (minAct >= minIn || minAct < minFi);

        if (esNoche) {
            const f = this.config.intensidad / 100;
            const esClaro = dom.body.classList.contains('modo-claro');
            const sepia = esClaro ? f * 0.75 : f;
            const brillo = esClaro ? 1 - (f / 18) : 1 - (f / 6);
            dom.root.style.filter = `sepia(${sepia}) brightness(${brillo}) saturate(${esClaro ? 1.1 : 1})`;
        } else {
            dom.root.style.filter = 'none';
        }
    }
};

// 4. REPRODUCTOR DE SONIDOS (Lazy Loading)
let sonidosActivados = localStorage.getItem('sonidos-web') !== 'disabled';
const ReproductorSonidos = {
    buffer: {},
    rutas: { exito: 'sounds/exito.mp3', error: 'sounds/notificacion.mp3', notificacion: 'sounds/notificacion.mp3', eliminado: 'sounds/pop.mp3' },
    init() {
        for (const [n, r] of Object.entries(this.rutas)) {
            const a = new Audio(r);
            a.preload = 'none'; // No consume datos hasta que sea necesario
            a.volume = 0.3;
            this.buffer[n] = a;
        }
        this.actualizarUI();
    },
    play(n) {
        if (!sonidosActivados) return;
        const s = this.buffer[n];
        if (s) {
            s.currentTime = 0;
            s.play().catch(() => {});
        }
    },
    toggle() {
        sonidosActivados = !sonidosActivados;
        localStorage.setItem('sonidos-web', sonidosActivados ? 'enabled' : 'disabled');
        this.actualizarUI();
    },
    actualizarUI() {
        const i = document.getElementById('iconoSonido'), t = document.getElementById('textoSonido');
        if (i && t) {
            i.className = sonidosActivados ? 'fas fa-volume-high' : 'fas fa-volume-xmark';
            t.textContent = sonidosActivados ? 'Sonidos Activados' : 'Sonidos Desactivados';
        }
    }
};

// 5. INICIALIZACIÓN
function inicializarPerfil() {
    if (!sesion.username) return;
    if (dom.nomPerfil) dom.nomPerfil.textContent = sesion.username;
    if (dom.imgPerfil) dom.imgPerfil.src = fotoPersistente || sesion.foto || FOTO_DEFAULT;
    if (dom.contInsignias) {
        dom.contInsignias.innerHTML = (sesion.username === "Alexei Chaves") 
            ? '<span class="insignia dev">Desarrollador</span><span class="insignia admin">Soporte</span>'
            : '<span class="insignia vendedor">Vendedor/a</span>';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Todo en paralelo para máxima velocidad
    const tareas = [
        verificarSesion().then(() => dom.body.style.display = 'block'),
        ReproductorSonidos.init(),
        inicializarPerfil(),
        ModoNocturno.init()
    ];

    try {
        await Promise.all(tareas);
        if (dom.loader) dom.loader.classList.add('loader-hidden');
    } catch (e) {
        window.location.replace("login.html");
    }

    // Delegación de eventos única
    document.addEventListener('click', (e) => {
        if (e.target.closest('#btnToggleSonido')) ReproductorSonidos.toggle();
    });
});

// 6. FUNCIONES WINDOW (Globales)
window.navegarConAnimacion = (url) => {
    if (!url || location.href.includes(url)) return;
    dom.body.classList.remove('apple-entrance');
    dom.body.classList.add('page-exit');
    setTimeout(() => { location.href = url; }, 500);
};

window.verDetalleUsuario = (username, foto, hora) => {
    const esClaro = localStorage.getItem('tema-usuario') === 'modo-claro';
    const colorT = esClaro ? '#1c1c1e' : '#ffffff';
    let insig = (username === "Alexei Chaves") ? '<span class="insignia dev">Desarrollador</span><span class="insignia admin">Soporte</span>' : '<span class="insignia vendedor">Vendedor/a</span>';

    Swal.fire({
        html: `<div style="padding:10px;"><img src="${foto}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #ff375f;margin-bottom:15px;"><div style="font-size:1.5rem;font-weight:bold;color:${colorT};">${username}</div><div style="display:flex;justify-content:center;gap:8px;margin-top:10px;">${insig}</div><div style="margin-top:15px;font-size:0.85rem;color:#8e8e93;"><i class="fa-regular fa-clock"></i> Última actividad: ${hora}</div></div>`,
        showConfirmButton: false, showCloseButton: true, background: esClaro ? '#ffffff' : '#1c1c1e', color: colorT,
        didOpen: (p) => p.style.borderRadius = '20px'
    });
};

// 7. MANEJO DE FOTO (Optimizado)
document.getElementById('inputFoto')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 200, scale = size / img.width;
            canvas.width = size; canvas.height = img.height * scale;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const base64 = canvas.toDataURL('image/jpeg', 0.7);
            if (dom.imgPerfil) dom.imgPerfil.src = base64;
            localStorage.setItem("foto-perfil", base64);
            ReproductorSonidos.play('exito');
            
            Swal.fire({ icon: 'success', title: 'Guardado', toast: true, position: 'top', showConfirmButton: false, timer: 1500, background: (localStorage.getItem('tema-usuario') === 'modo-claro' ? '#fff' : '#1c1c1e'), color: (localStorage.getItem('tema-usuario') === 'modo-claro' ? '#000' : '#fff') });
        };
    };
    reader.readAsDataURL(file);
});