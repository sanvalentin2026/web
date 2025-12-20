import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.5/+esm";

/* =========================
   🔗 SUPABASE
========================= */
const SUPABASE_URL = "https://yujwifmejokfbxndhtnf.supabase.co";
const SUPABASE_KEY = "sb_publishable_6IDYbrnJ3X4Z-mTsZ1TXQA_nwUTiFno";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================
   🧠 TOKEN SAFE LAYER
========================= */
function limpiarTokenAdmin() {
  localStorage.removeItem("admin_token");
}

async function solicitarPermisoAdmin() {
  const token = localStorage.getItem("admin_token");
  if (token) return token;

  const password = prompt("Contraseña de ediciones:");
  if (!password) return null;

  const { data, error } = await supabase.rpc("admin_login", {
    p_password: password
  });

  if (error || typeof data !== "string" || data.length < 10) {
    alert("❌ No autorizado.");
    return null;
  }

  localStorage.setItem("admin_token", data);
  return data;
}

async function ejecutarAdminRPC(nombreRPC, params, reintento = true) {
  let token = localStorage.getItem("admin_token");

  if (!token) {
    token = await solicitarPermisoAdmin();
    if (!token) return { error: true };
  }

  const res = await supabase.rpc(nombreRPC, {
    ...params,
    p_token: token
  });

  if (res.error && reintento) {
    limpiarTokenAdmin();
    return ejecutarAdminRPC(nombreRPC, params, false);
  }

  return res;
}

/* =========================
   🧩 DOM
========================= */
const form = document.getElementById("pedidoForm");
const pedidosBody = document.getElementById("pedidosBody");
const seccionSelect = document.getElementById("seccion");
const seccionReceptorSelect = document.getElementById("seccion_receptor");
const buscador = document.getElementById("buscador");
const filtroSeccion = document.getElementById("filtroSeccion");
const detallesInput = document.getElementById("detalles");
const paginacionDiv = document.getElementById("paginacion");

/* =========================
   📄 PAGINACIÓN
========================= */
const PEDIDOS_POR_PAGINA = 10;
let paginaActual = Number(sessionStorage.getItem("paginaActual")) || 1;
let paginaAnterior = paginaActual;
let pedidosCache = [];
let pedidosFiltrados = [];

/* =========================
   📦 SECCIONES
========================= */
function generarSecciones(select) {
  select.innerHTML = "<option value=''>Seleccione una sección</option>";
  for (let i = 7; i <= 11; i++) {
    for (let j = 1; j <= 4; j++) {
      select.innerHTML += `<option value="${i}-${j}">${i}-${j}</option>`;
    }
  }
}

generarSecciones(seccionSelect);
generarSecciones(seccionReceptorSelect);
generarSecciones(filtroSeccion);

/* =========================
   📅 FECHA
========================= */
function formatFechaMobile(fechaStr) {
  const f = new Date(fechaStr);
  return `${f.getDate().toString().padStart(2,"0")}/${(f.getMonth()+1)
    .toString().padStart(2,"0")}/${f.getFullYear()} ${f
    .getHours().toString().padStart(2,"0")}:${f
    .getMinutes().toString().padStart(2,"0")}`;
}

/* =========================
   🖥️ RENDER PEDIDOS
========================= */
function renderPedidos(pedidos) {
  pedidosBody.innerHTML = "";

  if (!pedidos.length) {
    pedidosBody.innerHTML = `<tr>
    <td colspan="8" class="no-pedidos">Sin pedidos para mostrar</td>
    </tr>`;
    return;
  }

  pedidos.forEach(p => {
    const fecha = window.innerWidth <= 600
      ? formatFechaMobile(p.created_at)
      : new Date(p.created_at).toLocaleString();

    pedidosBody.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td>${p.nombre_comprador} (${p.seccion_comprador})</td>
        <td>${p.nombre_receptor} (${p.seccion_receptor})</td>
        <td>${p.producto}</td>
        <td>${p.detalles || "<em>Sin detalles</em>"}</td>
        <td>${p.pagado ? "✅" : "❌"}</td>
        <td>${fecha}</td>
        <td>
          <button onclick="togglePagado(${p.id}, ${p.pagado})">Pago</button>
          <button onclick="editarDetalles(${p.id}, \`${p.detalles || ""}\`)">Detalles</button>
          <button onclick="entregarPedido(${p.id})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

/* =========================
   📄 RENDER PÁGINA
========================= */
function renderPagina() {
  const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
  const fin = inicio + PEDIDOS_POR_PAGINA;

  if (paginaActual > paginaAnterior) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (window.innerWidth <= 900) {
    pedidosBody.classList.remove("animar-cambio");
    void pedidosBody.offsetWidth;
    pedidosBody.classList.add("animar-cambio");
  }

  renderPedidos(pedidosFiltrados.slice(inicio, fin));
  renderPaginacion();

  paginaAnterior = paginaActual;
  sessionStorage.setItem("paginaActual", paginaActual);
}

/* =========================
   🔢 PAGINACIÓN
========================= */
function renderPaginacion() {
  paginacionDiv.innerHTML = "";
  const totalPaginas = Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA);
  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;

    if (i === paginaActual) btn.classList.add("activa");

    btn.onclick = () => {
      if (i === paginaActual) return;
      paginaActual = i;
      renderPagina();
    };

    paginacionDiv.appendChild(btn);
  }
}

/* =========================
   🔍 FILTROS
========================= */
function aplicarFiltros() {
  let pedidos = [...pedidosCache];

  if (filtroSeccion.value) {
    pedidos = pedidos.filter(p => p.seccion_receptor === filtroSeccion.value);
  }

  const q = buscador.value.trim().toLowerCase();
  if (q) {
    paginaActual = 1;
    pedidos = pedidos.filter(p =>
      p.id.toString() === q ||
      p.nombre_comprador.toLowerCase().includes(q) ||
      p.nombre_receptor.toLowerCase().includes(q) ||
      p.producto.toLowerCase().includes(q) ||
      p.detalles?.toLowerCase().includes(q)
    );
  }

  pedidosFiltrados = pedidos;
  renderPagina();
}

/* =========================
   🔄 CARGAR
========================= */
async function cargarPedidos() {
  const { data } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  pedidosCache = data || [];
  aplicarFiltros();
}

/* =========================
   📝 REGISTRAR
========================= */
form.addEventListener("submit", async e => {
  e.preventDefault();

  await supabase.from("pedidos").insert({
    nombre_comprador: nombre.value,
    seccion_comprador: seccionSelect.value,
    nombre_receptor: receptor.value,
    seccion_receptor: seccionReceptorSelect.value,
    producto: producto.value,
    detalles: detallesInput.value || null,
    pagado: false
  });

  form.reset();
  cargarPedidos();
});

/* =========================
   ⚙️ ACCIONES
========================= */
window.togglePagado = async (id, estado) => {
  await supabase.from("pedidos").update({ pagado: !estado }).eq("id", id);
  cargarPedidos();
};

window.editarDetalles = async (id, actuales) => {
  const nuevo = prompt("Editar detalles:", actuales);
  if (nuevo !== null) {
    await ejecutarAdminRPC("admin_update_detalles", {
      p_pedido_id: id,
      p_detalles: nuevo
    });
    cargarPedidos();
  }
};

window.entregarPedido = async id => {
  if (!confirm("¿Eliminar pedido?")) return;
  await ejecutarAdminRPC("admin_delete_pedido", { p_pedido_id: id });
  cargarPedidos();
};

/* =========================
   🎧 EVENTOS
========================= */
buscador.addEventListener("input", aplicarFiltros);
filtroSeccion.addEventListener("change", () => {
  paginaActual = 1;
  aplicarFiltros();
});

/* =========================
   🔴 REALTIME
========================= */
supabase
  .channel("pedidos-realtime")
  .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, cargarPedidos)
  .subscribe();

/* =========================
   🚀 INIT
========================= */
cargarPedidos();
