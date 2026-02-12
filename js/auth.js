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

// 3. GESTIÓN DE SONIDOS
let sonidosActivados = localStorage.getItem('sonidos-web') !== 'disabled';
export const ReproductorSonidos = {
    buffer: {},
    rutas: {
        exito: 'sounds/exito.mp3',
        error: 'sounds/notificacion.mp3',
        notificacion: 'sounds/notificacion.mp3'
    },
    init() {
        for (const [nombre, ruta] of Object.entries(this.rutas)) {
            this.buffer[nombre] = new Audio(ruta);
            this.buffer[nombre].volume = 0.3;
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

// 4. GUARDIA DE SEGURIDAD
export const verificarSesion = async function() {
    const path = window.location.pathname;
    const paginasLibres = ["login.html", "register.html", "registro.html"]; 
    const esPaginaLibre = paginasLibres.some(p => path.includes(p));

    if (esPaginaLibre) return null;

    const sesionLocal = localStorage.getItem("usuario");
    if (!sesionLocal) {
        window.location.replace("login.html");
        return null;
    }

    try {
        const sesion = JSON.parse(sesionLocal);
        const { data, error } = await db
            .from("usuarios")
            .select("id, permisos")
            .eq("id", sesion.id)
            .maybeSingle();

        if (!data || data.permisos !== true || error) {
            localStorage.removeItem("usuario");
            window.location.replace("login.html");
            return null;
        }
        return data;
    } catch (e) {
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
        Swal.fire({ text: "Ingrese los datos", icon: "warning", toast: true, position: 'top', showConfirmButton: false, timer: 1500, ...tema });
        return;
    }

    Swal.fire({ title: 'Verificando...', toast: true, position: 'top', showConfirmButton: false, didOpen: () => Swal.showLoading(), ...tema });

    try {
        const { data, error } = await db
            .from("usuarios")
            .select("*")
            .eq("username", userInput)
            .eq("password", passInput)
            .maybeSingle();

        if (error || !data) {
            ReproductorSonidos.play('notificacion');
            Swal.fire({ title: "Datos incorrectos", icon: "error", toast: true, position: 'top', showConfirmButton: false, timer: 1500, ...tema });
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
        Swal.fire({ title: "Error de conexión", icon: "error", ...tema });
    }
};

// 6. ACCIÓN: REGISTRO (Corregido sin email)
window.register = async function() {
    const user = document.getElementById("username")?.value.trim();
    const pass = document.getElementById("password")?.value.trim();
    const pass2 = document.getElementById("password2")?.value.trim();
    const tema = obtenerTema();

    if (!user || !pass || !pass2) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({ text: "Campos incompletos", icon: "warning", toast: true, position: 'top', timer: 2000, showConfirmButton: false, ...tema });
        return;
    }

    if (pass !== pass2) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({ text: "Contraseñas no coinciden", icon: "error", toast: true, position: 'top', timer: 2000, showConfirmButton: false, ...tema });
        return;
    }

    Swal.fire({ title: 'Procesando...', toast: true, position: 'top', showConfirmButton: false, didOpen: () => Swal.showLoading(), ...tema });

    // Eliminada la referencia a la variable 'email'
    const { error } = await db.from("usuarios").insert({ 
        username: user, 
        password: pass, 
        permisos: false 
    });

    if (error) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({ text: "El usuario ya existe", icon: "error", toast: true, position: 'top', timer: 2000, showConfirmButton: false, ...tema });
    } else {
        ReproductorSonidos.play('exito');
        await Swal.fire({ title: "La cuenta fue creada", text: "Espere su verificación", icon: "success", toast: true, position: 'top', timer: 2500, showConfirmButton: false, ...tema });
        window.location.replace("login.html");
    }
};

// 7. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-global');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('loader-hidden');
            loader.addEventListener('transitionend', () => loader.style.display = 'none', { once: true });
        }, 400);
    }
    verificarSesion();
});

window.logout = function() {
    localStorage.removeItem('usuario');
    window.location.replace('login.html');
};