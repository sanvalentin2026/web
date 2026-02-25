import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

// 1. CONFIGURACIÓN ÚNICA DE SUPABASE
const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. UTILIDADES DE INTERFAZ
export const obtenerTema = () => {
    const esOscuro = document.documentElement.classList.contains('modo-oscuro');
    return {
        background: esOscuro ? '#1c1c1e' : '#ffffff',
        color: esOscuro ? '#f5f5f7' : '#374151',
        confirmButtonColor: '#ff375f',
        customClass: { popup: 'mi-borde-redondeado' }
    };
};

// 3. GESTIÓN DE SONIDOS (Optimizado con Lazy Loading)
let sonidosActivados = localStorage.getItem('sonidos-web') !== 'disabled';
export const ReproductorSonidos = {
    buffer: {},
    rutas: {
        exito: 'sounds/exito.mp3',
        error: 'sounds/notificacion.mp3',
        notificacion: 'sounds/notificacion.mp3'
    },
    init() {
        // Los sonidos se preparan pero no se cargan totalmente hasta que sea necesario
        for (const [nombre, ruta] of Object.entries(this.rutas)) {
            const audio = new Audio(ruta);
            audio.volume = 0.3;
            audio.preload = 'auto'; 
            this.buffer[nombre] = audio;
        }
    },
    play(nombre) {
        if (!sonidosActivados) return;
        const sonido = this.buffer[nombre];
        if (sonido) { 
            sonido.currentTime = 0; 
            sonido.play().catch(() => {}); 
        }
    }
};
ReproductorSonidos.init();

// 4. GUARDIA DE SEGURIDAD (Optimizado para evitar consultas innecesarias)
export const verificarSesion = async function() {
    const path = window.location.pathname;
    const paginasLibres = ["login.html", "register.html", "registro.html"]; 
    if (paginasLibres.some(p => path.includes(p))) return null;

    const sesionLocal = localStorage.getItem("usuario");
    if (!sesionLocal) {
        if (!path.includes("login.html")) window.location.replace("login.html");
        return null;
    }

    try {
        const sesion = JSON.parse(sesionLocal);
        // Solo traemos los campos necesarios para ahorrar ancho de banda
        const { data, error } = await db
            .from("usuarios")
            .select("id, permisos")
            .eq("id", sesion.id)
            .limit(1)
            .maybeSingle();

        if (error || !data || data.permisos !== true) {
            throw new Error("Sesion invalida");
        }
        return data;
    } catch (e) {
        localStorage.removeItem("usuario");
        window.location.replace("login.html");
        return null;
    }
};

// 5. ACCIÓN: LOGIN
window.login = async function() {
    const userInput = document.getElementById("username")?.value.trim();
    const passInput = document.getElementById("password")?.value;
    const tema = obtenerTema();

    if (!userInput || !passInput) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({ text: "Ingrese los datos", icon: "warning", toast: true, position: 'top', showConfirmButton: false, timer: 2500, ...tema });
        return;
    }

    Swal.fire({ title: 'Verificando...', toast: true, position: 'top', showConfirmButton: false, didOpen: () => Swal.showLoading(), ...tema });

    try {
        const { data, error } = await db
            .from("usuarios")
            .select("id, username, permisos") // Traer solo lo necesario
            .eq("username", userInput)
            .eq("password", passInput)
            .maybeSingle();

        if (error || !data) {
            ReproductorSonidos.play('notificacion');
            Swal.fire({ title: "Datos incorrectos, o no encontrados", icon: "error", toast: true, position: 'top', showConfirmButton: false, timer: 1500, ...tema });
            return;
        }

        if (data.permisos === true) {
            localStorage.setItem("usuario", JSON.stringify({ id: data.id, username: data.username, permisos: true }));
            ReproductorSonidos.play('exito');
            window.location.replace("index.html");
        } else {
            ReproductorSonidos.play('notificacion');
            Swal.fire({ title: "Validación Pendiente", text: "Su cuenta requiere autorización", icon: "info", toast: true, position: 'top', showConfirmButton: false, timer: 3000, ...tema });
        }
    } catch (e) {
        Swal.fire({ title: "Error de conexión", text: "Intente más tarde", icon: "error", ...tema });
    }
};

// 6. ACCIÓN: REGISTRO
window.register = async function() {
    const user = document.getElementById("username")?.value.trim();
    const pass = document.getElementById("password")?.value.trim();
    const pass2 = document.getElementById("password2")?.value.trim();
    const tema = obtenerTema();

    if (!user || !pass || !pass2) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({ text: "Campos incompletos", icon: "warning", toast: true, position: 'top', timer: 2500, showConfirmButton: false, ...tema });
        return;
    }

    if (pass !== pass2) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({ text: "Las contraseñas no coinciden", icon: "error", toast: true, position: 'top', timer: 3000, showConfirmButton: false, ...tema });
        return;
    }

    Swal.fire({ title: 'Procesando...', toast: true, position: 'top', showConfirmButton: false, didOpen: () => Swal.showLoading(), ...tema });

    try {
        const { error } = await db.from("usuarios").insert({ 
            username: user, 
            password: pass, 
            permisos: false 
        });

        if (error) throw error;

        ReproductorSonidos.play('exito');
        await Swal.fire({ title: "Cuenta creada con exito", text: "Espere su verificación", icon: "success", toast: true, position: 'top', timer: 3000, showConfirmButton: false, ...tema });
        window.location.replace("login.html");
        
    } catch (error) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({ text: "El usuario ya existe", icon: "error", toast: true, position: 'top', timer: 2000, showConfirmButton: false, ...tema });
    }
};

// 7. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-global');
    if (loader) {
        // Eliminado setTimeout innecesario para mayor velocidad percibida
        requestAnimationFrame(() => {
            loader.classList.add('loader-hidden');
            loader.addEventListener('transitionend', () => loader.style.display = 'none', { once: true });
        });
    }
    verificarSesion();
});

window.logout = function() {
    localStorage.removeItem('usuario');
    window.location.replace('login.html');
};