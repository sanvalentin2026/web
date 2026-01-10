/**
 * MANTENIMIENTO: ENTRADA DIRECTA POST-ACTUALIZACIÓN
 * [cite: 2026-01-03, 2026-01-08]
 */

const temaG = localStorage.getItem('tema') || 'oscuro';
const esO = temaG === 'oscuro';
const t = {
    bg: esO ? '#1c1c1e' : '#ffffff',
    txt: esO ? '#ffffff' : '#000000',
    accent: '#e11d48'
};

// Inyectar estilos para SweetAlert [cite: 2026-01-08]
const st = document.createElement('style');
st.innerHTML = `
    body { background: ${t.bg} !important; color: ${t.txt} !important; }
    div:where(.swal2-container) div:where(.swal2-popup) { 
        background: ${t.bg} !important; border-radius: 20px !important; 
    }
    div:where(.swal2-container) .swal2-html-container, div:where(.swal2-container) .swal2-title { 
        color: ${t.txt} !important; opacity: 1 !important; font-weight: bold !important; 
    }
`;
document.head.appendChild(st);

async function entrarDirecto() {
    // Limpiamos cualquier rastro de cola por si acaso (sin esperar respuesta)
    const userRes = await supabaseClient.auth.getUser();
    const userId = userRes.data.user?.id;
    if (userId) supabaseClient.from('cola_espera').delete().eq('id', userId);

    let seg = 10; 
    Swal.fire({
        toast: true,
        icon: 'success',
        position: 'top',
        title: 'Actualización completada',
        html: `Entrando en: <b>${seg}</b>s.`,
        background: t.bg,
        color: t.txt,
        showConfirmButton: false,
    });

    const interval = setInterval(() => {
        seg--;
        const b = Swal.getHtmlContainer()?.querySelector('b');
        if (b) b.textContent = seg;
        
        if (seg <= 0) {
            clearInterval(interval);
            window.location.replace('index.html');
        }
    }, 1000);
}

// --- INICIO ---
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificación inicial
    const { data } = await supabaseClient.from('sistema_control').select('*').eq('id', 1).single();
    
    if (!data || !data.en_mantenimiento) {
        window.location.replace('index.html');
        return;
    }

    const msgEl = document.getElementById('installing-msg');
    if (msgEl) msgEl.innerText = `Instalando: ${data.mensaje}`;

    // 2. Escuchar el cambio a false para meter a todos de golpe
    supabaseClient.channel('check_final')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'sistema_control', 
            filter: 'id=eq.1' 
        }, (payload) => {
            if (payload.new.en_mantenimiento === false) {
                entrarDirecto();
            }
        })
        .subscribe();
});