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


//SONIDOS
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
            this.buffer[nombre].preload = 'auto'; // Precarga en segundo plano
            this.buffer[nombre].volume = 0.3;
        }
    },

    play(nombre) {
        const sonido = this.buffer[nombre];
        if (sonido) {
            // requestAnimationFrame asegura que el audio no interrumpa la animación de la alerta
            requestAnimationFrame(() => {
                sonido.currentTime = 0;
                sonido.play().catch(() => {});
            });
        }
    }
};
ReproductorSonidos.init();

/* ======================================================

    🛡️ PARCHE DE SEGURIDAD: VALIDACIÓN ANTI-CONSOLA

====================================================== */

export async function validarSeguridadReal() {

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

            console.error(" Intento de acceso no autorizado detectado.");

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

// ==========================================

// 🛡️ GUARDIA DE ACCESO

// ==========================================

export const verificarSesion = async function() {
    const loader = document.getElementById("pantalla-carga");
    const sesionLocal = localStorage.getItem("usuario");

    // Si no hay sesión, ni siquiera intentamos quitar el loader, redirigimos
    if (!sesionLocal) {
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

        // 🚨 SI EL PERMISO ES FALSO O NO EXISTE
        if (error || !data || data.permisos !== true) {
            localStorage.removeItem("usuario");
            
            // Usamos SweetAlert como guardaste en tus instrucciones
    const tema = obtenerTema();
ReproductorSonidos.play('notification');
await Swal.fire({
    toast: true,
    icon: 'error',
    title: 'Sesion revocada',
    text: 'Su sesion vencio.',
    position: 'top',
    timer: 5000,
    showConfirmButton: false,
    background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
    color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151',
    customClass: {
        popup: 'mi-borde-redondeado',
        title: ''
    }
});

            window.location.replace("login.html");
            return null;
        }

        // ✅ SOLO SI TODO ESTÁ BIEN: Desplegamos la web y quitamos el loader
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => {
                loader.style.visibility = "hidden";
                // Aquí podrías disparar la animación de "despliegue central" de la tabla
            }, 500);
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
        ReproductorSonidos.play('notificacion');

        Swal.fire({text: "Campos incompletos", icon: "warning",position:'top', toast:true, showConfirmButton: false, timer: 1500, customClass: { popup: 'mi-borde-redondeado'}, ...tema });

        return;

    }

    if (pass !== pass2) {
        ReproductorSonidos.play('notificacion');

        Swal.fire({text: "Las contraseñas no coinciden", icon: "error", position:'top',toast:true, showConfirmButton: false, timer: 2500, customClass: { popup: 'mi-borde-redondeado'}, ...tema });

        return;

    }



    Swal.fire({ title: 'Creando cuenta...', ...tema, didOpen: () => Swal.showLoading(),toast:true, showConfirmButton:false, position:'top',customClass: { popup: 'mi-borde-redondeado'}, });



    const { error } = await supabase.from("usuarios").insert({

        username: user,

        password: pass,

        permisos: false

    });



    if (error) {

        const msg = error.code === "23505" ? "El usuario ya existe" : "Error al registrar";
        ReproductorSonidos.play('notificacion');
        Swal.fire({text: msg, icon: "error", showConfirmButton: false,toast:true, timer:3000, customClass: { popup: 'mi-borde-redondeado'}, position: 'top', ...tema });

    } else {
        ReproductorSonidos.play('exito');
        await Swal.fire({
            toast:true,
            showConfirmButton:false,
            title: "Cuenta creada, inicie sesion",

            showConfirmButton: false,

            timer: 1600,

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
        ReproductorSonidos.play('notificacion');
        Swal.fire({
            text: "Ingrese sus datos", 
            icon: "warning", 
            showConfirmButton: false, 
            toast: true, 
            position: 'top', 
            timer: 1500, 
            customClass: { popup: 'mi-borde-redondeado' }, 
            ...tema 
        });
        return;
    }

    Swal.fire({
        toast: true,
        showConfirmButton: false,
        title: 'Verificando...',
        ...tema,
        didOpen: () => Swal.showLoading(),
        position: 'top',
        customClass: { popup: 'mi-borde-redondeado' },
    });

    const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("username", userInput)
        .eq("password", passInput)
        .maybeSingle();

    if (error || !data) {
        localStorage.removeItem("usuario");
        ReproductorSonidos.play('notificacion');
        Swal.fire({
            title: "Datos incorrectos o inexistentes",
            icon: "error",
            position: 'top',
            showConfirmButton: false,
            toast: true,
            timer: 1500,
            ...tema,
            customClass: { popup: 'mi-borde-redondeado' }
        });
        return;
    }

    if (data.permisos === true) {
        localStorage.setItem("usuario", JSON.stringify({
            id: data.id,
            username: data.username,
            permisos: true
        }));
        window.location.replace("index.html");
    } else {
        localStorage.removeItem("usuario");
        ReproductorSonidos.play('notificacion');
        Swal.fire({
            toast: true,
            showConfirmButton: false,
            title: "Acceso Pendiente",
            text: "Su cuenta aun no esta verificada por un administrador",
            icon: "info",
            position: 'top',
            timer: 1500,
            customClass: { popup: 'mi-borde-redondeado' },
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

        confirmButtonText: 'Confirmar',

        cancelButtonText: 'Cancelar',
        customClass: { popup: 'mi-borde-redondeado'},

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
