import { verificarSesion, obtenerTema } from './auth.js';

let canalRealtime = null;
const sesion = JSON.parse(localStorage.getItem("usuario") || "{}");

const ReproductorSonidos = {
    buffer: {},
    rutas: { exito: 'sounds/exito.mp3', notificacion: 'sounds/notificacion.mp3' },
    init() {
        for (const [n, r] of Object.entries(this.rutas)) {
            this.buffer[n] = new Audio(r);
            this.buffer[n].volume = 0.3;
        }
    },
    play(n) { if (this.buffer[n]) this.buffer[n].play().catch(() => {}); }
};

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
        setInterval(() => this.aplicar(), 1000);
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

const renderizarMensaje = (m) => {
    const contenedor = document.getElementById('chat-mensajes');
    if (!contenedor) return;
    const esMio = m.emisor === sesion.username;
    const div = document.createElement('div');
    div.className = esMio ? 'msg-mio' : 'msg-otro';
    div.style = `max-width: 85%; padding: 10px; border-radius: 12px; margin-bottom: 4px; display: flex; flex-direction: column; ${esMio ? 'align-self: flex-end;' : 'align-self: flex-start;'}`;
    div.innerHTML = `<small style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 2px; font-weight: bold;">${m.emisor === "Alexei Chaves" ? 'SOPORTE' : m.emisor}</small><span>${m.mensaje}</span>`;
    contenedor.appendChild(div);
    contenedor.scrollTop = contenedor.scrollHeight;
};

const cargarTickets = async () => {
    const isAdmin = sesion.username === "Alexei Chaves";
    const { data: misTickets } = await db.from("reportes_web").select("*").eq("reportado_por", sesion.username).order("id", { ascending: false });
    const listaMios = document.getElementById("listaMisTickets");
    if (listaMios) {
        listaMios.innerHTML = (misTickets && misTickets.length > 0) ? misTickets.map(t => `
            <div class="ticket-card">
                <div>
                    <strong>Ticket #${t.id}</strong><br>
                    <small style="color: var(--primary-red); font-weight: bold;">${t.tipo.toUpperCase()}</small>
                </div>
                <a href="reportar.html?ticket=${t.id}" style="color: var(--primary-red); text-decoration: none;">Ir al ticket →</a>
            </div>`).join('') : "<p style='opacity:0.5; font-size:0.8rem;margin-left:10px;'>No tiene tickets abiertos.</p>";
    }
    if (isAdmin) {
        if (document.getElementById("panelAdminTickets")) document.getElementById("panelAdminTickets").style.display = "block";
        const { data: todos } = await db.from("reportes_web").select("*").order("id", { ascending: false });
        const listaAdmin = document.getElementById("listaTicketsAdmin");
        if (listaAdmin) {
            listaAdmin.innerHTML = (todos && todos.length > 0) ? todos.map(t => `
                <div class="ticket-card">
                    <div>
                        <strong>Ticket #${t.id} - ${t.reportado_por}</strong><br>
                        <small style="color: var(--primary-red); font-weight: bold;">${t.tipo.toUpperCase()}</small>
                    </div>
                    <a href="reportar.html?ticket=${t.id}" style="color:var(--primary-red); padding:6px 12px; border-radius:8px; text-decoration:none; font-size:1rem;">Atender →</a>
                </div>`).join('') : "<p style='opacity:0.5; font-size:0.8rem;margin-left:10px;'>No hay tickets pendientes.</p>";
        }
    }
};

const iniciarChat = async (ticketId) => {
    const { data: ticket, error } = await db.from("reportes_web").select("*").eq("id", ticketId).single();

    if (error || !ticket || (ticket.reportado_por !== sesion.username && sesion.username !== "Alexei Chaves")) {
        window.location.replace("reportar.html");
        return;
    }

    const seccionChat = document.getElementById('seccion-chat');
    document.getElementById('seccion-reporte').style.display = 'none';
    seccionChat.style.display = 'block';

    if (sesion.username === "Alexei Chaves") {
        const infoHtml = `
            <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; margin-bottom:15px; border:1px solid var(--primary-red); font-size:0.85rem;">
                <p style="margin:0 0 5px 0;"><strong>Reportante:</strong> ${ticket.reportado_por}</p>
                <p style="margin:0 0 5px 0;"><strong>Tipo:</strong> ${ticket.tipo.toUpperCase()}</p>
                <p style="margin:0 0 5px 0;"><strong>Descripción:</strong> ${ticket.descripcion}</p>
                <p style="margin:0 0 5px 0;"><strong>Entorno:</strong> ${ticket.entorno}</p>
                <p style="margin:0; font-size:0.7rem; opacity:0.6;"><strong>Datos:</strong> ${ticket.user_agent}</p>
            </div>
            <button id="btnCerrarDef" style="background:#ff375f; color:white; border:none; padding:10px; border-radius:8px; margin-bottom:10px; cursor:pointer; width:100%; font-weight:bold;">Cerrar este ticket</button>
        `;
        seccionChat.insertAdjacentHTML('afterbegin', infoHtml);
        
        document.getElementById('btnCerrarDef').onclick = async () => {
            const { isConfirmed } = await Swal.fire({
                toast:true, position:'top', title: '¿Cerrar este ticket?', icon: 'question',
                showCancelButton: true, confirmButtonColor: '#ff375f', confirmButtonText: 'Confirmar', cancelButtonText:'Cancelar', ...obtenerTema()
            });
            if (isConfirmed) await db.from('reportes_web').delete().eq('id', ticketId);
        };
    }
    
    const { data: mensajes } = await db.from('chat_mensajes').select('*').eq('ticket_id', ticketId).order('creado_at', { ascending: true });
    if (mensajes) mensajes.forEach(renderizarMensaje);
    
    if (canalRealtime) canalRealtime.unsubscribe();
    canalRealtime = db.channel(`ticket:${ticketId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_mensajes', filter: `ticket_id=eq.${ticketId}` }, payload => {
        renderizarMensaje(payload.new);
        if (payload.new.emisor !== sesion.username) ReproductorSonidos.play('notificacion');
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reportes_web', filter: `id=eq.${ticketId}` }, async () => {
        await Swal.fire({
            toast:true, position:'top', title: 'Ticket solucionado', text: 'Ticket cerrado por soporte.',
            icon: 'info', showConfirmButton:false, timer:3000, ...obtenerTema()
        });
        window.location.href = "reportar.html";
    })
    .subscribe();

    document.getElementById('btnEnviarMsg').onclick = async () => {
        const input = document.getElementById('inputMensaje');
        const msg = input.value.trim();
        if (!msg) return;
        input.value = '';
        await db.from('chat_mensajes').insert({ ticket_id: ticketId, emisor: sesion.username, mensaje: msg });
    };
};

const init = async () => {
    try {
        await verificarSesion();
        ReproductorSonidos.init();
        document.body.className = localStorage.getItem('tema-usuario') || 'modo-oscuro';
        document.body.style.display = 'block';
        const params = new URLSearchParams(window.location.search);
        const ticketId = params.get('ticket');
        if (ticketId) await iniciarChat(ticketId);
        else await cargarTickets();
        if (document.getElementById('loader-global')) document.getElementById('loader-global').classList.add('loader-hidden');
    } catch (e) { window.location.replace("login.html"); }
};

const form = document.getElementById("formReporte");
if (form) {
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const btn = document.getElementById("btnEnviar");
        btn.disabled = true;
        btn.textContent = "Abriendo...";
        const { data, error } = await db.from("reportes_web").insert({
            tipo: document.getElementById("tipo").value,
            descripcion: document.getElementById("descripcion").value.trim(),
            entorno: document.getElementById("entorno").value.trim(),
            user_agent: navigator.userAgent,
            reportado_por: sesion.username
        }).select();
        
        if (!error) {
            ReproductorSonidos.play('exito');
            form.reset();
            window.location.href = `reportar.html?ticket=${data[0].id}`;
        }
        btn.disabled = false;
        btn.textContent = "Crear un Ticket";
    });
}
document.addEventListener('DOMContentLoaded', init);