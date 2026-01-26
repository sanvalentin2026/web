document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-global');

    setTimeout(() => {
        if (loader) {
            loader.classList.add('loader-hidden');
        }
    }, 200); 
});

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

let sonidosActivados = localStorage.getItem('sonidos-web') !== 'disabled';

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
            texto.textContent = sonidosActivados ? 'Sonido Activo' : 'Silenciado';
            icono.style.color = sonidosActivados ? 'var(--primary-red)' : '#8e8e93';
        }
    }
};

ReproductorSonidos.init();

document.addEventListener('click', (e) => {
    if (e.target.closest('#btnToggleSonido')) {
        ReproductorSonidos.toggle();
    }
});

/* ======================================================
    🛡️ PARCHE DE SEGURIDAD: VALIDACIÓN ANTI-CONSOLA
====================================================== */

export async function validarSeguridadReal() {
    const sesionRaw = localStorage.getItem("usuario");

    if (!sesionRaw) {
        window.location.replace("login.html");
        return false;
    }

    try {
        const sesion = JSON.parse(sesionRaw);
        const { data, error } = await db
            .from("usuarios")
            .select("permisos")
            .eq("id", sesion.id)
            .single();

        if (error || !data || data.permisos !== true) {
            localStorage.removeItem("usuario");
            window.location.replace("login.html");
            return false;
        }
        return true;
    } catch (e) {
        window.location.replace("login.html");
        return false;
    }
}

// ==========================================
// 🛡️ GUARDIA DE ACCESO (ACTUALIZADO CON EXPULSIÓN)
// ==========================================

export const verificarSesion = async function() {
    const loader = document.getElementById("pantalla-carga") || document.getElementById("loader-global");
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
            .single();

        if (error || !data || data.permisos !== true) {
            localStorage.removeItem("usuario");
            
            const tema = obtenerTema();
            ReproductorSonidos.play('notificacion');

            let timerInterval;
            await Swal.fire({
                title: 'Sesión Inválidada',
                html: 'Su cuenta ha sido invalidada.',
                icon: 'error',
                timer: 5000,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                ...tema,
                customClass: { popup: 'mi-borde-redondeado' },
                willClose: () => {
                    clearInterval(timerInterval);
                }
            });

            window.location.replace("login.html");
            return null;
        }

        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => {
                loader.style.visibility = "hidden";
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
// 🟢 REGISTRO
// ==========================

window.register = async function() {
    const user = document.getElementById("username")?.value.trim();
    const pass = document.getElementById("password")?.value.trim();
    const pass2 = document.getElementById("password2")?.value.trim();
    const tema = obtenerTema();

    if (!user || !pass || !pass2) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({text: "Campos incompletos", icon: "warning", position:'top', toast:true, showConfirmButton: false, timer: 1500, customClass: { popup: 'mi-borde-redondeado'}, ...tema });
        return;
    }
    if (pass !== pass2) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({text: "Las contraseñas no coinciden", icon: "error", position:'top',toast:true, showConfirmButton: false, timer: 2500, customClass: { popup: 'mi-borde-redondeado'}, ...tema });
        return;
    }

    Swal.fire({ title: 'Procesando...', ...tema, didOpen: () => Swal.showLoading(), toast:true, showConfirmButton:false, position:'top', customClass: { popup: 'mi-borde-redondeado'}, });

    const { error } = await db.from("usuarios").insert({
        username: user,
        password: pass,
        permisos: false
    });

    if (error) {
        const msg = error.code === "23505" ? "El usuario ya existe" : "Error al registrar";
        ReproductorSonidos.play('notificacion');
        Swal.fire({text: msg, icon: "error", showConfirmButton: false, toast:true, timer:3000, customClass: { popup: 'mi-borde-redondeado'}, position: 'top', ...tema });
    } else {
        ReproductorSonidos.play('exito');
        await Swal.fire({
            toast:true,
            showConfirmButton:false,
            title: "Cuenta creada, inicie sesión",
            timer: 1600,
            icon: "success",
            position: 'top',
            customClass: { popup: 'mi-borde-redondeado' },
            ...tema
        });
        window.location.replace("login.html");
    }
};

// ==========================================
// 🔵 LOGIN
// ==========================================

window.login = async function() {
    const userInput = document.getElementById("username")?.value.trim();
    const passInput = document.getElementById("password")?.value;
    const tema = obtenerTema();

    if (!userInput || !passInput) {
        ReproductorSonidos.play('notificacion');
        Swal.fire({ text: "Ingrese sus datos", icon: "warning", showConfirmButton: false, toast: true, position: 'top', timer: 1500, customClass: { popup: 'mi-borde-redondeado' }, ...tema });
        return;
    }

    Swal.fire({ toast: true, showConfirmButton: false, title: 'Verificando...', ...tema, didOpen: () => Swal.showLoading(), position: 'top', customClass: { popup: 'mi-borde-redondeado' }, });

    const { data, error } = await db
        .from("usuarios")
        .select("*")
        .eq("username", userInput)
        .eq("password", passInput)
        .maybeSingle();

    if (error || !data) {
        localStorage.removeItem("usuario");
        ReproductorSonidos.play('notificacion');
        Swal.fire({ title: "Datos incorrectos", icon: "error", position: 'top', showConfirmButton: false, toast: true, timer: 1500, ...tema, customClass: { popup: 'mi-borde-redondeado' } });
        return;
    }

    if (data.permisos === true) {
        localStorage.setItem("usuario", JSON.stringify({ id: data.id, username: data.username, permisos: true }));
        window.location.replace("index.html");
    } else {
        localStorage.removeItem("usuario");
        ReproductorSonidos.play('notificacion');
        Swal.fire({ toast: true, showConfirmButton: false, title: "Validacion Pendiente", text: "Su cuenta requiere verificación", icon: "info", position: 'top', timer: 2500, customClass: { popup: 'mi-borde-redondeado' }, ...tema });
    }
};

// ==========================================
// 🔴 LOGOUT
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
    let sesionInterval = null;
    function startSesionWatcher() {
        if (sesionInterval) return;
        sesionInterval = setInterval(async () => {
            if (document.visibilityState === 'visible') await verificarSesion();
        }, 30000);
    }
    function stopSesionWatcher() {
        if (sesionInterval) { clearInterval(sesionInterval); sesionInterval = null; }
    }
    
    startSesionWatcher();
    window.addEventListener('focus', () => { verificarSesion(); startSesionWatcher(); });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') stopSesionWatcher(); else startSesionWatcher();
    });

    const sesion = JSON.parse(localStorage.getItem("usuario"));
    db.channel('cambios-permisos')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'usuarios',
            filter: `id=eq.${sesion.id}`
        }, (payload) => {
            if (payload.new.permisos === false) {
                verificarSesion();
            }
        })
        .subscribe();
}