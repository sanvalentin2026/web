// ==========================================
// 🔐 CONFIGURACIÓN ÚNICA DE SUPABASE
// ==========================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 🎨 UTILIDAD DE TEMAS (Lectura de LocalStorage)
// ==========================================
export const obtenerTema = () => {
    const temaGuardado = localStorage.getItem('tema-usuario') || 'modo-oscuro';
    const esOscuro = temaGuardado === 'modo-oscuro';
    
    return {
        background: esOscuro ? '#1c1c1e' : '#ffffff',
        color: esOscuro ? '#f5f5f7' : '#374151',
        confirmButtonColor: '#ff375f',
    };
};

// ==========================================
// 🛡️ GUARDIA DE ACCESO
// ==========================================
export const verificarSesion = async function() {
    const sesionLocal = localStorage.getItem("usuario");
    if (!sesionLocal) {
        document.documentElement.style.display = 'none';
        window.location.replace("login.html");
        return null;
    }
    try {
        const sesion = JSON.parse(sesionLocal);
        const { data, error } = await supabase
            .from("usuarios")
            .select("id, permisos")
            .eq("id", sesion.id)
            .single();

        // 🚨 SI EL PERMISO CAMBIÓ A FALSE O HUBO ERROR
        if (error || !data || data.permisos !== true) {
            const tema = obtenerTema();
            localStorage.removeItem("usuario");

            await Swal.fire({
                title: "Sesión Revocada",
                text: "Tu acceso ha sido desactivado por un administrador.",
                icon: "error",
                allowOutsideClick: false,
                ...tema
            });
            
            window.location.replace("login.html");
            return null;
        }
        
        document.body.style.display = 'block';
        return data;
    } catch (e) {
        window.location.replace("login.html");
        return null;
    }
};
// ==========================
// 🟢 REGISTRO (CON ALERTA Y TEMA)
// ==========================
window.register = async function() {
    const user = document.getElementById("username")?.value.trim();
    const pass = document.getElementById("password")?.value.trim();
    const pass2 = document.getElementById("password2")?.value.trim();
    const tema = obtenerTema();

    if (!user || !pass || !pass2) {
        Swal.fire({ title: "Error", text: "Campos incompletos", icon: "warning", ...tema });
        return;
    }
    if (pass !== pass2) {
        Swal.fire({ title: "Error", text: "Las contraseñas no coinciden", icon: "error", ...tema });
        return;
    }

    Swal.fire({ title: 'Creando cuenta...', ...tema, didOpen: () => Swal.showLoading(), position:'top' });

    const { error } = await supabase.from("usuarios").insert({
        username: user,
        password: pass,
        permisos: false 
    });

    if (error) {
        const msg = error.code === "23505" ? "El usuario ya existe" : "Error al registrar";
        Swal.fire({ title: "Error", text: msg, icon: "error", ...tema });
    } else {
        await Swal.fire({ 
            text: "Cuenta enviada para aprobación", 
            showConfirmButton: false,
            timer: 2500,
            icon: "success",
            position: 'top', 
            customClass: {
            popup: 'mi-borde-redondeado'
        },
            ...tema 
        });
        window.location.replace("login.html");
    }
};

// ==========================================
// 🔵 LOGIN (CON TEMA)
// ==========================================
window.login = async function() {
    const userInput = document.getElementById("username")?.value.trim();
    const passInput = document.getElementById("password")?.value;
    const tema = obtenerTema();

    if (!userInput || !passInput) {
        Swal.fire({ title: "Error", text: "Ingresa tus datos", icon: "warning", ...tema });
        return;
    }

    Swal.fire({ 
        title: 'Verificando...', 
        ...tema, 
        didOpen: () => Swal.showLoading(), 
        position: 'top' 
    });

    // 1. Buscamos al usuario en la DB
    const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("username", userInput)
        .eq("password", passInput)
        .maybeSingle();

    // 2. Si no existe o hay error, BORRAMOS cualquier rastro de intentos previos
    if (error || !data) {
        localStorage.removeItem("usuario"); // SEGURIDAD: Limpiar ante error
        Swal.fire({ title: "Error", text: "Credenciales inválidas", icon: "error", ...tema });
        return;
    }

    // 3. Verificamos permisos antes de dejarlo pasar
    if (data.permisos === true) {
        // RECIÉN AQUÍ, cuando estamos seguros, guardamos la sesión
        localStorage.setItem("usuario", JSON.stringify({
            id: data.id,
            username: data.username,
            permisos: true
        }));
        window.location.replace("index.html");
    } else {
        // Si no tiene permisos, NO GUARDAMOS NADA y limpiamos el storage
        localStorage.removeItem("usuario"); 
        Swal.fire({ 
            title: "Acceso Pendiente", 
            text: "Tu cuenta debe ser aprobada por un administrador.", 
            icon: "info", 
            ...tema 
        });
    }
};

// ==========================================
// 🔴 LOGOUT (CON TEMA)
// ==========================================
window.logout = function() {
    const tema = obtenerTema();
    Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        text: "Tendras que volver a iniciar sesion para interactuar.",
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        ...tema
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('usuario');
            window.location.replace('login.html');
        }
    });
};

// =================================================
// 🕵️ VIGILANTE EN TIEMPO REAL
// =================================================
if (localStorage.getItem("usuario")) {
    // Opción A: Revisar cada 30 segundos (Muy estable y no consume recursos)
    setInterval(async () => {
        await verificarSesion();
    }, 30000); // 30000ms = 30 segundos

    // Opción B: Escuchar cambios directos en la base de datos (Tiempo Real)
    const sesion = JSON.parse(localStorage.getItem("usuario"));
    supabase
        .channel('cambios-permisos')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'usuarios', 
            filter: `id=eq.${sesion.id}` 
        }, (payload) => {
            if (payload.new.permisos === false) {
                verificarSesion(); // Esto disparará la alerta y el logout
            }
        })
        .subscribe();
}
/* ======================================================
    🛡️ PARCHE DE SEGURIDAD: VALIDACIÓN ANTI-CONSOLA
====================================================== */
async function validarSeguridadReal() {
    const sesionRaw = localStorage.getItem("usuario");
    
    // Si no hay nada, al login
    if (!sesionRaw) {
        window.location.replace("login.html");
        return false;
    }

    try {
        const sesion = JSON.parse(sesionRaw);
        
        // CONSULTA DE VERDAD: Le preguntamos a la DB por ese ID
        const { data, error } = await supabase
            .from("usuarios")
            .select("permisos")
            .eq("id", sesion.id)
            .single();

        // Si hay error, el usuario no existe, o los permisos en DB son FALSE
        if (error || !data || data.permisos !== true) {
            console.error("🚫 Intento de acceso no autorizado detectado.");
            localStorage.removeItem("usuario"); // Limpiamos el hack
            window.location.replace("login.html");
            return false;
        }

        // Si llegamos aquí, el usuario es REAL y tiene PERMISOS en la nube
        return true;
    } catch (e) {
        window.location.replace("login.html");
        return false;
    }
}