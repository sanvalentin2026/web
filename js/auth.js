// ==========================
// 🔐 SUPABASE CONFIG
// ==========================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 🎨 UTILIDAD DE TEMAS (Para SweetAlert)
// ==========================================
const obtenerTema = () => ({
    bg: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
    txt: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151'
});



// =================================================
// 🛡️ GUARDIA DE ACCESO (PROTECCIÓN TOTAL)
// Bloquea el renderizado ANTES de mostrar nada
// =================================================
export const verificarSesion = async function() {
    const sesionLocal = localStorage.getItem("usuario");
    if (!sesionLocal) {
        document.documentElement.style.display = 'none'; 
        window.location.replace("login.html"); // Usa replace para evitar bucles
        return;
    }

    const sesion = JSON.parse(sesionLocal);

    const { data, error } = await supabase
        .from("usuarios")
        .select("id, username, permisos") // Traemos también el username por si acaso
        .eq("id", sesion.id)
        .single();

    if (error || !data || data.permisos !== true) { // <--- Verificamos permiso de una vez
        localStorage.removeItem("usuario");
        window.location.replace("login.html");
        return;
    }

    // 🔥 ACTUALIZAMOS EL LOCALSTORAGE CON LA INFO REAL DE LA DB
    // Esto hace que si cambias el permiso en Supabase, el navegador se entere
    localStorage.setItem("usuario", JSON.stringify({
        ...sesion,           // Mantiene lo que ya tenías (id, loginTime)
        permisos: data.permisos // Actualiza con el valor fresco (true)
    }));
    
    document.documentElement.style.display = 'block';
    return data;
};
// ==========================
// 🟢 REGISTRO (INSERCIÓN ÚNICA)
// ==========================
window.register = async function register() {
    const username = document.getElementById("username").value.trim();
    const password1 = document.getElementById("password").value.trim();
    const password2 = document.getElementById("password2").value.trim();
    const tema = obtenerTema();

    if (!username || !password1 || !password2) {
        Swal.fire({ title: "Error", text: "Completa todos los campos", icon: "error", background: tema.bg, color: tema.txt });
        return;
    }
    if (password1 !== password2) {
        Swal.fire({ title: "Error", text: "Las contraseñas no coinciden", icon: "error", background: tema.bg, color: tema.txt });
        return;
    }

    Swal.fire({ title: 'Creando cuenta...', background: tema.bg, color: tema.txt, didOpen: () => Swal.showLoading() });

    // Inserción directa con verificación de RLS
    const { error } = await supabase.from("usuarios").insert({
        username: username,
        password: password1,
        permisos: false 
    });

    if (error) {
        // Si el error es por duplicado (username único en DB)
        const msg = error.code === "23505" ? "El usuario ya existe" : error.message;
        Swal.fire({ title: "Error", text: msg, icon: "error", background: tema.bg, color: tema.txt });
    } else {
        await Swal.fire({ 
            title: "¡Éxito!", 
            text: "Cuenta creada. Inicia sesión.", 
            icon: "success", 
            background: tema.bg, 
            color: tema.txt 
        });
        window.location.href = "login.html";
    }
};

// ==========================================
// 🔵 LOGIN SEGURO
// ==========================================
window.login = async function login() {
    const userInput = document.getElementById("username")?.value.trim();
    const passInput = document.getElementById("password")?.value;
    const tema = obtenerTema();

    if (!userInput || !passInput) {
        Swal.fire({ title: "Error", text: "Completa los campos", icon: "error", background: tema.bg, color: tema.txt });
        return;
    }

    Swal.fire({ title: 'Verificando...', background: tema.bg, color: tema.txt, didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    const { data, error } = await supabase
        .from("usuarios")
        .select("id, username, password, permisos")
        .eq("username", userInput)
        .eq("password", passInput)
        .maybeSingle();

    if (error || !data) {
        Swal.fire({ title: "Error", text: "Credenciales incorrectas", icon: "error", background: tema.bg, color: tema.txt });
        return;
    }

    // Guardamos los datos en el navegador
    localStorage.setItem("usuario", JSON.stringify({
        id: data.id,
        username: data.username,
        permisos: data.permisos,
        loginTime: Date.now()
    }));

    // --- AQUÍ ESTÁ EL CAMBIO CLAVE ---
    if (data.permisos === true || data.permisos === "true") {
        // SI TIENE PERMISO: Se va a las tablas
        window.location.replace("index.html");
    } else {
        // SI NO TIENE PERMISO: Se queda aquí y le avisamos
        Swal.fire({ 
            title: "Acceso Pendiente", 
            text: "Tu cuenta ha sido creada y registrada, pero debe verificarse por un administrador.", 
            icon: "info", 
            background: tema.bg, 
            color: tema.txt 
        });
    }
};

// ==========================
// 🔴 LOGOUT
// ==========================
// Definimos la función afuera para que sea GLOBAL
// Definimos la función y la asignamos a 'window' para que el HTML la vea sí o si
window.logout = function() {
    // Verificar que SweetAlert esté cargado
    if (typeof Swal === 'undefined') {
        if (confirm("¿Seguro que quieres salir?")) {
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        }
        return;
    }

    // Configuración de la Alerta
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: "Tendrás que volver a iniciar sesión para interactuar.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E11D48',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
        // Adaptación de colores al tema actual
        background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
        color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('usuario'); // Borra la sesión
            window.location.href = 'login.html'; // Redirige
        }
    });
};