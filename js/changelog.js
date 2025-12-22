// ======== SISTEMA DE CHANGELOG (MODERNO) ========

const changelogData = [
    {
        version: "1.2.16",
        title: "Styles rewrite",
        date: "20/12/2025 · 6:05 PM",
        changes: [
            "Se creó el modo oscuro y una función para cambiarlo.",
            "Se creó una sección para reportar errores.",
            "Se reindexaron elementos para mejorar la velocidad."
        ]
    },
    {
        version: "1.2.19",
        title: "Feedback upgrade",
        date: "22/12/2025 · 3:15 PM",
        changes: [
            "Se integró SweetAlert2 para todas las confirmaciones y alertas.",
            "Se rediseñó el Changelog con estilo Liquid Glass.",
            "Mejora en la validación de contraseñas de administrador.",
            "Corrección de espaciados en modo oscuro para mejor lectura."
        ]
    },
    {
        version: "1.2.21",
        title: "UX Optimization",
        date: "22/12/2025 · 3:45 PM",
        changes: [
            "Corrección de errores de sintaxis en funciones de gestión.",
            "Optimización del sistema de persistencia del historial de cambios."
        ]
    }
];

function showChangelog() {
    const lastVersion = changelogData[changelogData.length - 1].version;
    const seenVersion = localStorage.getItem("seenChangelogVersion");

    // Solo procede si la versión es nueva
    if (seenVersion === lastVersion) return;

    const data = changelogData[changelogData.length - 1];
    
    const listHtml = data.changes
        .map(c => `<li style="text-align: left; margin-bottom: 10px; font-size: 14px; display: flex; gap: 10px;">
                    <span style="color: #E11D48;">•</span> <span>${c}</span>
                   </li>`)
        .join("");

    Swal.fire({
        title: `<small style="font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px;">Nueva Actualización</small><br>
                <span style="color: #E11D48;">v${data.version} - ${data.title}</span>`,
        html: `
            <p style="font-size: 12px; margin-bottom: 15px; opacity: 0.7;">${data.date}</p>
            <ul style="list-style: none; padding: 15px 0; margin: 0; border-top: 1px solid rgba(225,29,72,0.1);">
                ${listHtml}
            </ul>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#E11D48',
        background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
        color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151',
        backdrop: `rgba(0,0,0,0.4)`,
        allowOutsideClick: false // Obliga a leer para que se marque como visto
    }).then(() => {
        // Guarda la versión después de que el usuario cierra el mensaje
        localStorage.setItem("seenChangelogVersion", lastVersion);
    });
}

// Ejecución al cargar
window.addEventListener("load", showChangelog);