// ======== SISTEMA DE CHANGELOG ========

const changelogData = [
    {
        version: "1.0.0",
        title: "Primera versión",
        date: "14/12/2025 · 8:35 PM",
        changes: [
            "Se arreglaron algunos enlaces de archivos"
        ]
    },
        {
        version: "1.0.1",
        title: "Cambios internos",
        date: "14/12/2025 · 8:50 PM",
        changes: [
            "Se arregalron errores de la base de datos"
        ]
    },
    {
        version: "1.0.3",
        title: "Hotfixes y Parche",
        date: "14/12/2025 · 8:50 PM",
        changes: [
            "La conexion con la base de datos presentaba errores",
            "Se arreglaron algunos valores de almacenamiento", 
            "Se mejoro la interfaz",
            "Se agrego la funcion de \"Ordenar por seccion\" y \"Por fecha\"",
            "Se mejoraron algunos textos para un mejor entendimiento"
            
        ]
    },
    {
        version: "1.0.4",
        title: "Modificaciones internas y visuales",
        date: "14/12/2025 · 11:10 PM",
        changes: [
            "La conexion con la base de datos presentaba errores",
            "Se arreglaron algunos valores de almacenamiento", 
            "Se mejoro la interfaz",
            "Se agrego la funcion de \"Ordenar por seccion (Menor a mayor)\" y \"Por fecha y hora\"",
            "Se mejoraron algunos textos para un mejor entendimiento",
            "Se agrego Persona reseptora, Seccion receptora",
            "La funcion pagado o no pagado ahora es editable dentro de la web, anteriormente solo desde la base de datos",
            "Se elimino la funcion de pedido anonimo"
        ]
    },
        {
        version: "1.0.5",
        title: "Hotfix",
        date: "14/12/2025 · 11:13 PM",
        changes: [
            "Se limpio la base de datos de pedidos de prueba",
        ]
    },
    {
        version: "1.0.6",
        title: "Hotfix",
        date: "14/12/2025 · 11:16 PM",
        changes: [
            "Algunas tablas no se mostraban bien en dispositivos moviles, se corrigio este error",
        ]
    },
    {
        version: "1.0.7",
        title: "Hotfix",
        date: "14/12/2025 · 11:22 PM",
        changes: [
            "Se mejoraron algunos textos para un mejor entendimiento",
        ]
    },
        {
        version: "1.0.8",
        title: "Hotfix",
        date: "14/12/2025 · 11:43 PM",
        changes: [
            "Algunos pedidos de encimaban en la versión móvil, se corrigio",
            "Algunos valores de tipo texto se veian mal en la version movil, se corrigio",
        ]
    },
    {
        version: "1.0.9",
        title: "Interno | Bugfix",
        date: "14/12/2025 · 11:52 PM",
        changes: [
            "Se reiniciaron los id's de los pedidos ya que se encontraban bugeados por pruebas internas",
        ]
    },
    {
        version: "1.0.10",
        title: "Nueva funcionalidad",
        date: "16/12/2025 · 11:00 AM",
        changes: [
            "Se agregara un buscador de pedidos basado en 'Nombre del comprador'",
        ]
    },
        {
        version: "1.0.11",
        title: "Hotfix, Bugfix",
        date: "15/12/2025 · 6:10 AM",
        changes: [
            "Se mejoro el orden de los pedidos en la tabla principal en mobiles para mejor lectura",
            "Existia un bug en mobiles donde las fechas no se mostraban de manera correcta, se corrigio",
        ]
    },
            {
        version: "1.1.0",
        title: "Hotfixes | Bugfixex",
        date: "15/12/2025 · 8:00 AM",
        changes: [
            "Se corrigieron errores menores en la interfaz de usuario",
            "Se corrigieron errores menores en la base de datos",
            "Se mejoro la experiencia de usuario en dispositivos moviles",
            "Se mejoro la funcion de ordenar por:",
            "Se arreglaron varios errores tipograficos en la interfaz",
            "Se arreglaron errores de funcionaminento de lagunas funciones",
        ]
    },
    {
        version: "1.1.2",
        title: "Hotfixes | Bugfixex",
        date: "15/12/2025 · 8:00 AM",
        changes: [
            "Se corrigieron errores menores en la interfaz de usuario",
            "Se corrigieron errores menores en la base de datos",
            "Se mejoro la experiencia de usuario en dispositivos moviles",
            "Se mejoro la funcion de ordenar por:",
            "Se arreglaron varios errores tipograficos en la interfaz",
            "Se arreglaron errores de funcionaminento de algunas funciones",
        ]
    },
        {
        version: "1.1.3",
        title: "Hotfixes | Bugfixex",
        date: "15/12/2025 · 12:30 PM",
        changes: [
            "Se agregaron funciones de busqueda nuevas",
            "Se reescribio desde cero todo el manejo de datos de la base de datos para mejorar la estabilidad",
            "La base de datos ahora cuenta con nuevos protocolos de seguridad",
            "La web se reestructuro para mejor optimizacion y estabilidad",
            "Se mejoro la experiencia de usuario en dispositivos moviles",
            "Se mejoro la funcion de ordenar por:",
            "Se arreglaron varios errores tipograficos en la interfaz",
            "Se arreglaron errores de funcionaminento de algunas funciones",
        ]
    },
    {
    version: "1.1.4",
    title: "Hotfixes | Stability & UX Improvements",
    date: "15/12/2025 · 1:55 PM",
    changes: [
        "Se incorporaron nuevas mejoras en el sistema de búsqueda para mayor precisión y rendimiento.",
        "Se reescribió completamente el manejo de datos y la comunicación con la base de datos para garantizar mayor estabilidad.",
        "La base de datos fue actualizada con nuevos protocolos y políticas de seguridad.",
        "La estructura general de la web fue optimizada para mejorar el rendimiento y la estabilidad del sistema.",
        "Se mejoró significativamente la experiencia de usuario en dispositivos móviles.",
        "Se optimizó y corrigió el funcionamiento del sistema de ordenamiento de pedidos.",
        "Se corrigieron diversos errores tipográficos en la interfaz de usuario.",
        "Se solucionaron errores de funcionamiento en distintas funcionalidades del sistema."
    ]
    },
    {
    version: "1.1.5",
    title: "Hotfixes | Stability",
    date: "15/12/2025 · 3:15 PM",
    changes: [
        "Se aumentaron los slots de conexiones simultaneas a 200 slots y los slots de consultas(pool size) a 40, numeros superiores de request esperaran en cola a que un slot se libere",
        "Se optimizo la gestion de conexiones a la base de datos para mejorar la estabilidad bajo alta demanda",
    ]
},
    {
    version: "1.1.6",
    title: "Hotfixes",
    date: "15/12/2025 · 7:37 PM",
    changes: [
        "Se mejoraron algunos textos",
        "Se corrigieron errores de orden en las tablas en la version de desktop",
        "Se agregaron fuentes para embellecer textos",
        "Se reescbribio el sistema de colores haciendolo mas agradable a la vista" 
    ]
},
    {
    version: "1.1.7",
    title: "Version Completa",
    date: "15/12/2025 · 8:25 PM",
    changes: [
        "Se mejoraron algunos textos",
        "Ahora usar secciones en el buscador es valido",
        "Se corrigieron algunos estilos que se veian mal en celular",
        "Se limpio la base de datos, reseteando los id's y eliminando pedidos de prueba"
    ]
},    {
    version: "1.1.8",
    title: "Hotfix",
    date: "16/12/2025 · 7:53 AM",
    changes: [
    "Se rediseño el tamaño de las tablas y formularios en tablets y computadors",
    "Algunos textos se cortaban, arreglado",
    "Las tablas ahora muestran lineas separatorias que hacen mas facil la lectura",
    "Base de datos limpia"
    ]
},
{
    version: "1.1.9",
    title: "Hotfix",
    date: "16/12/2025 · 7:59 AM",
    changes: [
    "Los pedidos en la version de celular presentaban lineas extrañas, arreglado"
    ]
},
{
    version: "1.1.10",
    title: "Hotfix, Tests",
    date: "16/12/2025 · 9:00 AM",
    changes: [
    "Se agregaron lineas separatorias entre pedidos en la version de celular para mejor lectura",
    "Se realizaron pruebas de rendimiento bajo un alto uso de la web",
    "Se mejoro el traslado de datos con la base de datos"
    ]

},
{
    version: "1.1.12",
    title: "Parche de seguridad",
    date: "16/12/2025 · 10:35 AM",
    changes: [
    "Se agregaron nuevos protocolos en la edicion de datos, esto por proteccion de datos",
    "Ahora el querer Marcar pagos, Editr o Borrar pedidos se solicitara una contraseña para proceder, la misma no se solicitara todas las veces, se autentifica y deja de solicitarla"
    ]
    
},
{
    version: "1.1.13",
    title: "Parche",
    date: "16/12/2025 · 11:03 AM",
    changes: [
    "Correcion de errores de la 1.1.12",
    "LA WEB PRESENTA UN NUEVO SISTEMA DE SEGURIDAD CUALQUIER FALLA PORFAVOR INFORMARLA"
    ]
},
{
    version: "1.2.1",
    title: "Patch de estabilidad y UI",
    date: "16/12/2025 · 1:40 PM",
    changes: [
    " 🐞 Fixes",
 "Corregido bug donde la vista móvil de la tabla se mostraba en desktop/laptop",
 "Solucionado error visual que mostraba 'ID del pedido: Sin pedidos para mostrar'",
 "Eliminadas reglas CSS fuera de media queries que forzaban layout móvil en escritorio",
 "EL buscador no funcionaba de forma correcta",
 "Era posible registrar pedidos sin secciones",
 
 "🎨 UI / UX",
 "Mejora en los bordes de la tabla en versión desktop",
 "Mayor espaciado horizontal en celdas para mejor legibilidad",
 "Ajuste de uso del ancho de columnas evitando saltos de línea innecesarios",
 "Producto y detalles permiten multilinea sin afectar el resto de columnas",

 "📱 Mobile",
 "Cada pedido se separa visualmente como tarjeta",
 "Añadidos márgenes, bordes y sombra suave para mejorar lectura",

 "🔐 Seguridad",
 "Acciones críticas (editar y borrar) protegidas por contraseña de administrador",
 "Token temporal almacenado en localStorage para evitar reingreso constante",

 "⚙ Estabilidad",
 "Sistema validado para más de 500 pedidos",
 "Sin límites de scroll en Chrome ni Safari",
 "Render y filtros optimizados."
 ]
},
{
    version: "1.2.2",
    title: "Parche y mejoras de estabilidad",
    date: "17/12/2025 · 12:37 PM",
    changes: [
    "Se arreglaron errores relacinados a los tokes de sesion",
    "Los errores de autorizacion denegada ahora son poco probables",
    "Se automatizo el sistema de tokens",
    "Se eliminaros caracteristicas obsoletas relacionadas con la '1.2.1 - (PARCHE)'"
    ]
},
{
    version: "1.2.3",
    title: "Hotfix",
    date: "18/12/2025 · 09:10 AM",
    changes: [
    "Se corrigieron errores de la consola",
    "Mejoras estéticas menores",
    ]
},
{
    version: "1.2.5",
    title: "Hotfix visual menor",
    date: "18/12/2025 · 4:53 PM",
    changes: [
    "Se rediseñaron los colores de toda la web, haciendola mas agradable para la vista"
    ]
},
{
    version: "1.2.6",
    title: "Hotfixes | Functions",
    date: "18/12/2025 · 10:40 PM",
    changes: [
    "Pequeños cambios en interfaz",   
    "Se aplicaron algunos colores faltantes",
    "Se creo la funcionn de reportar errore",
    "Mejoras de estabilidad"
    ]
},
{
    version: "1.2.7",
    title: "Hotfixes",
    date: "18/12/2025 · 11:12 PM",
    changes: [
    "Pequeños cambios en interfaz",   
    "Cambios en la intefaz de celulares"
    ]
},
{
    version: "1.2.8",
    title: "Hotfixes",
    date: "19/12/2025 · 09:44 AM",
    changes: [
    "Mejoras en la interfaz de celulares y tablets",
    "Correccion de errores menores"
    ]
},
{
    version: "1.2.9",
    title: "Hotfixes",
    date: "19/12/2025 · 10:10 AM",
    changes: [
    "Correccion de overflow en la version de tablet"
    ]
},
{
    version: "1.2.16 - Final",
    title: "Styles rewrite",
    date: "20/12/2025 · 6:05 PM",
    changes: [
    "Se creo el modo oscuro y una funcion para cambiarlo, esto para hacer la web mas agradable a la vista",
    "Se creo una seccion pare reportar errores",
    "Se reindexaron algunas cosas"
    ]
},
{
    version: "1.2.21",
    title: "Optimización de Feedback",
    date: "22/12/2025 · 3:15 PM",
    changes: [
        "Se integró SweetAlert2 para todas las confirmaciones y alertas del sistema.",
        "Se rediseñó el Changelog para que coincida con el estilo Liquid Glass.",
        "Se mejoró la validación de contraseñas de administrador con una interfaz más moderna.",
        "Corrección de espaciados en el modo oscuro para mejorar la legibilidad."
    ]
},
];

const lastVersion = changelogData[changelogData.length - 1].version;

function shouldShowChangelog() {
    return localStorage.getItem("seenChangelogVersion") !== lastVersion;
}

function showChangelog() {
    const data = changelogData[changelogData.length - 1];

    // Generamos la lista de cambios con estilo
    const listHtml = data.changes
        .map(c => `<li style="text-align: left; margin-bottom: 10px; font-size: 14px; display: flex; gap: 10px;">
                    <span style="color: #E11D48;">•</span> <span>${c}</span>
                   </li>`)
        .join("");

    Swal.fire({
        title: `<small style="font-size: 12px; opacity: 0.6; text-transform: uppercase;">Nueva Actualización</small><br>
                <span style="color: #E11D48;">v${data.version} - ${data.title}</span>`,
        html: `
            <p style="font-size: 12px; margin-bottom: 15px; opacity: 0.7;">${data.date}</p>
            <ul style="list-style: none; padding: 15px 0; margin: 0; border-top: 1px solid rgba(225,29,72,0.1);">
                ${listHtml}
            </ul>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido, continuar',
        confirmButtonColor: '#E11D48',
        // Adaptación automática al tema oscuro
        background: document.body.classList.contains('modo-oscuro') ? '#1c1c1e' : '#fff',
        color: document.body.classList.contains('modo-oscuro') ? '#f5f5f7' : '#374151',
        showClass: {
            popup: 'animate__animated animate__fadeInUp' // Si usas Animate.css
        }
    });
}

window.addEventListener("load", () => {
    if (shouldShowChangelog()) {
        localStorage.setItem("seenChangelogVersion", lastVersion);
        showChangelog();
    }
});
