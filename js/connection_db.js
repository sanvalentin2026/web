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

  if (error || !data) {
    alert("❌ No autorizado.");
    console.error(error);
    return null;
  }

  // Validación defensiva del token
  if (typeof data !== "string" || data.length < 10) {
    console.error("Token inválido recibido:", data);
    return null;
  }

  localStorage.setItem("admin_token", data);
  return data;
}

/**
 * RPC admin seguro:
 * - Usa token actual
 * - Si falla por autorización → limpia token
 * - Reintenta UNA sola vez
 */
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

  if (
    res.error &&
    (
      res.error.code === "P0001" ||
      res.error.message?.toUpperCase().includes("NO AUTORIZADO")
    )
  ) {
    limpiarTokenAdmin();

    if (reintento) {
      const nuevoToken = await solicitarPermisoAdmin();
      if (!nuevoToken) return { error: true };
      return ejecutarAdminRPC(nombreRPC, params, false);
    }
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

let pedidosCache = [];

/* =========================
   📦 SECCIONES
========================= */
function generarSecciones(select) {
  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Seleccione una sección";
  select.appendChild(empty);

  for (let i = 7; i <= 11; i++) {
    for (let j = 1; j <= 4; j++) {
      const option = document.createElement("option");
      option.value = `${i}-${j}`;
      option.textContent = `${i}-${j}`;
      select.appendChild(option);
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
  return `${String(f.getDate()).padStart(2,"0")}/${String(f.getMonth()+1).padStart(2,"0")}/${f.getFullYear()} ${String(f.getHours()).padStart(2,"0")}:${String(f.getMinutes()).padStart(2,"0")}`;
}

/* =========================
   🖥️ RENDER
========================= */
function renderPedidos(pedidos) {
  pedidosBody.innerHTML = "";

  if (!pedidos.length) {
    pedidosBody.innerHTML = `
      <tr>
        <td colspan="8" class="no-pedidos">Sin pedidos para mostrar.</td>
      </tr>`;
    return;
  }

  pedidos.forEach(p => {
    const fecha = window.innerWidth <= 600
      ? formatFechaMobile(p.created_at)
      : new Date(p.created_at).toLocaleString();

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nombre_comprador} (${p.seccion_comprador})</td>
      <td>${p.nombre_receptor} (${p.seccion_receptor})</td>
      <td>${p.producto}</td>
      <td class="detalles">${p.detalles || "<em>Sin detalles</em>"}</td>
      <td>${p.pagado ? "✅" : "❌"}</td>
      <td>${fecha}</td>
      <td>
        <button onclick="togglePagado(${p.id}, ${p.pagado})">Cambiar estado del pago</button>
        <button onclick="editarDetalles(${p.id}, \`${p.detalles || ""}\`)">Editar detalles</button>
        <button onclick="entregarPedido(${p.id})">Eliminar pedido</button>
      </td>
    `;

    pedidosBody.appendChild(tr);
  });
}

/* =========================
   🔄 CARGAR
========================= */
async function cargarPedidos() {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error) {
    pedidosCache = data;
    aplicarFiltros();
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
    if (/^\d+$/.test(q)) {
      pedidos = pedidos.filter(p => p.id === Number(q));
    } else {
      pedidos = pedidos.filter(p =>
        p.nombre_comprador.toLowerCase().includes(q) ||
        p.nombre_receptor.toLowerCase().includes(q) ||
        p.seccion_comprador.toLowerCase().includes(q) ||
        p.seccion_receptor.toLowerCase().includes(q) ||
        p.producto.toLowerCase().includes(q) ||
        p.detalles?.toLowerCase().includes(q)
      );
    }
  }

  renderPedidos(pedidos);
}

/* =========================
   📝 REGISTRAR
========================= */
form.addEventListener("submit", async e => {
  e.preventDefault();

  const { error } = await supabase.from("pedidos").insert({
    nombre_comprador: nombre.value.trim(),
    seccion_comprador: seccionSelect.value,
    nombre_receptor: receptor.value.trim(),
    seccion_receptor: seccionReceptorSelect.value,
    producto: producto.value.trim(),
    detalles: detallesInput.value.trim() || null,
    pagado: false
  });

  if (!error) {
    form.reset();
    cargarPedidos();
  }
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
  if (nuevo === null) return;

  const res = await ejecutarAdminRPC("admin_update_detalles", {
    p_pedido_id: id,
    p_detalles: nuevo
  });

  if (!res.error) cargarPedidos();
};

window.entregarPedido = async (id) => {
  if (!confirm("¿Eliminar pedido?")) return;

  const res = await ejecutarAdminRPC("admin_delete_pedido", {
    p_pedido_id: id
  });

  if (!res.error) cargarPedidos();
};

/* =========================
   🎧 EVENTOS
========================= */
buscador.addEventListener("input", aplicarFiltros);
filtroSeccion.addEventListener("change", aplicarFiltros);

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
