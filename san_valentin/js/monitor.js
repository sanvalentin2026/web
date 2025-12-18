/* =========================================================
   MONITOR DE ESTADO · v1.0
   Proyecto: Pedidos San Valentín
   Seguro · Ligero · Plan FREE
========================================================= */

/* ===============================
   ESTADO GENERAL DE LA APP
================================ */
window.APP_MONITOR = {
  web: "estable",
  db: "desconocido",
  erroresJS: 0,
  acciones: 0,
  inicio: new Date().toISOString()
};

/* ===============================
   CAPTURA DE ERRORES JS
================================ */
window.addEventListener("error", (e) => {
  window.APP_MONITOR.web = "media";
  window.APP_MONITOR.erroresJS++;

  console.error("❌ Error JS detectado:", e.message);
});

/* ===============================
   CHECK DE BASE DE DATOS
================================ */
async function checkDBStatus(supabase) {
  try {
    const { error } = await supabase
      .from("pedidos")
      .select("id")
      .limit(1);

    if (error) throw error;

    window.APP_MONITOR.db = "estable y segura";
    console.info("🗄️ DB: conexión estable");
  } catch (err) {
    window.APP_MONITOR.db = "inestable";
    window.APP_MONITOR.web = "media";
    console.error("🗄️ DB: conexión inestable", err);
  }
}

/* ===============================
   LOG DE ACCIONES (CONSOLA)
================================ */
function logAction(accion, detalle) {
  window.APP_MONITOR.acciones++;

  console.log(
    `📝 [${new Date().toLocaleString()}] ${accion}: ${detalle}`
  );
}

/* ===============================
   LOG OPCIONAL EN SUPABASE
   (Solo si existe tabla logs)
================================ */
async function logDB(supabase, accion, detalle) {
  try {
    await supabase.from("logs").insert({
      accion,
      detalle
    });
  } catch (e) {
    console.warn("⚠️ No se pudo guardar log en DB");
  }
}

/* ===============================
   REPORTE GENERAL
================================ */
async function reporteSistema(supabase) {
  await checkDBStatus(supabase);

  const reporte = {
    estado_web: window.APP_MONITOR.web,
    estado_db: window.APP_MONITOR.db,
    errores_js: window.APP_MONITOR.erroresJS,
    acciones: window.APP_MONITOR.acciones,
    activo_desde: window.APP_MONITOR.inicio,
    hora_reporte: new Date().toLocaleString()
  };

  console.table(reporte);
  return reporte;
}

/* ===============================
   EXPONER FUNCIONES A CONSOLA
================================ */
window.MONITOR = {
  estado: () => window.APP_MONITOR,
  checkDB: checkDBStatus,
  logAction,
  logDB,
  reporte: reporteSistema
};

/* ===============================
   MENSAJE DE ARRANQUE
================================ */
console.info("🟢 Monitor de sistema activo");
