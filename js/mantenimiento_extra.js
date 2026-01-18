// Extraído de mantenimiento.html
// Inicialización del cliente
const supabaseClient = supabase.createClient('https://yujwifmejokfbxndhtnf.supabase.co', 'sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno');

// Aplicar clase de tema inmediatamente para evitar parpadeo blanco
if (localStorage.getItem('tema') === 'claro') {
    document.body.classList.add('light');
}
