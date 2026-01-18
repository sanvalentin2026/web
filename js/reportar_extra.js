// Extraído de reportar.html
(function() {
  const tema = localStorage.getItem('tema-usuario') || 'modo-oscuro';
  document.body.classList.add(tema);
})();

// Lógica de reporte y sonidos
import { verificarSesion, obtenerTema } from './auth.js'; 

const init = async () => {
  try {
    await verificarSesion();
    document.body.style.display = 'block';
  } catch (e) {
    window.location.replace("login.html");
  }
};
init();

const form = document.getElementById("formReporte");
const btn = document.getElementById("btnEnviar");
if (form && btn) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const tema = obtenerTema();

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
          this.buffer[nombre].preload = 'auto';
          this.buffer[nombre].volume = 0.3;
        }
      },
      play(nombre) {
        const sonido = this.buffer[nombre];
        if (sonido) {
          requestAnimationFrame(() => {
            sonido.currentTime = 0;
            sonido.play().catch(() => {});
          });
        }
      }
    };
    ReproductorSonidos.init();

    btn.disabled = true;
    btn.textContent = "Reportando...";

    const { error } = await db.from("reportes_web").insert({
      tipo: document.getElementById("tipo").value,
      descripcion: document.getElementById("descripcion").value.trim(),
      version: document.getElementById("version").value.trim(),
      entorno: document.getElementById("entorno").value.trim(),
      user_agent: navigator.userAgent
    });

    if (error) {
      ReproductorSonidos.play('notificacion');
      Swal.fire({
        toast:true,
        showConfirmButton:false,
        timer:1500,
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar el reporte',
        position: 'top',
        customClass: {
          popup: 'mi-borde-redondeado'
        },
        ...tema
      });
    } else {
      ReproductorSonidos.play('exito');
      await Swal.fire({
        toast:true,
        icon: 'success',
        title: 'Reporte enviado',
        timer: 1500,
        showConfirmButton: false,
        position: 'top',
        customClass: {
          popup: 'mi-borde-redondeado'
        },
        ...tema
      });
      form.reset();
    }

    btn.disabled = false;
    btn.textContent = "Enviar reporte";
  });
}
