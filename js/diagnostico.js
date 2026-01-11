(function diagnosticoWeb() {
    console.clear();
    const tema = { 
        titulo: 'color: white; background: #E11D48; padding: 4px 10px; border-radius: 5px; font-weight: bold;',
        info: 'color: #3b82f6; font-weight: bold;',
        error: 'color: #ef4444; font-weight: bold;',
        exito: 'color: #10b981; font-weight: bold;'
    };

    console.log("%c SISTEMA DE DIAGNÓSTICO DE RENDIMIENTO Y SEGURIDAD ", tema.titulo);

    // 1. ESTABILIDAD VISUAL (CLS)
    let cls = 0;
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) cls += entry.value;
        }
        console.log(`%c[Estabilidad] %cCLS (Cumulative Layout Shift): ${cls.toFixed(4)}`, tema.info, cls > 0.1 ? tema.error : tema.exito);
    }).observe({type: 'layout-shift', buffered: true});

    // 2. VELOCIDAD DE CARGA
    window.addEventListener('load', () => {
        const nav = performance.getEntriesByType("navigation")[0];
        const t_carga = (nav.loadEventEnd / 1000).toFixed(2);
        console.log(`%c[Rendimiento] %cTiempo total de carga: ${t_carga}s`, tema.info, t_carga > 3 ? tema.error : tema.exito);
        
        // 3. DETECCIÓN DE PROBLEMAS EN RECURSOS
        const recursos = performance.getEntriesByType("resource");
        const pesados = recursos.filter(r => r.transferSize > 1000000); // > 1MB
        if (pesados.length > 0) {
            console.warn("%c[Problemas] Recursos pesados detectados (>1MB):", tema.error);
            pesados.forEach(r => console.log(`- ${r.name.split('/').pop()} (${(r.transferSize/1024/1024).toFixed(2)} MB)`));
        }
    });

    // 4. SEGURIDAD (Vulnerabilidades básicas)
    const headersFaltantes = [];
    if (!document.contentSecurityPolicy) headersFaltantes.push("Content-SecurityPolicy (CSP)");
    if (window.location.protocol !== 'https:') console.error("%c[Vulnerabilidad] LA WEB NO USA HTTPS", tema.error);
    
    if (headersFaltantes.length > 0) {
        console.log(`%c[Seguridad] %cPosibles mejoras de cabeceras: ${headersFaltantes.join(', ')}`, tema.info, 'color: gray;');
    }

    // 5. ESTADO DE LA CONEXIÓN
    if (navigator.connection) {
        const { effectiveType, downlink } = navigator.connection;
        console.log(`%c[Red] %cConexión: ${effectiveType} (${downlink} Mbps)`, tema.info, 'color: gray;');
    }

    console.log("%c----------------------------------------------------", "color: gray;");
})();



window.mostrarReporteSeguridad = (resultados) => {
    const tema = obtenerTema();
    
    // Contamos los fallos para decidir el icono
    const fallos = resultados.filter(r => r.status === 'error').length;
    
    const htmlReporte = `
        <div style="text-align: left; font-family: sans-serif;">
            <p style="font-size: 13px; opacity: 0.8; margin-bottom: 15px;">
                Resultados del escaneo de vulnerabilidades en <b>localhost/LiveServer</b>.
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${resultados.map(r => `
                    <div style="padding: 10px; border-radius: 8px; background: ${tema.bg === '#fff' ? '#f3f4f6' : '#2c2c2e'}; border-left: 4px solid ${r.status === 'success' ? '#10b981' : '#e11d48'};">
                        <div style="font-weight: bold; font-size: 12px; color: ${r.status === 'success' ? '#10b981' : '#e11d48'};">
                            ${r.status === 'success' ? '✅ PROTEGIDO' : '⚠️ VULNERABLE'}
                        </div>
                        <div style="font-size: 14px; margin-top: 3px; color: ${tema.txt};">
                            ${r.mensaje}
                        </div>
                        <div style="font-size: 11px; opacity: 0.6; margin-top: 5px; font-style: italic;">
                            ${r.recomendacion}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${fallos > 0 ? `
                <div style="margin-top: 15px; padding: 10px; background: rgba(225, 29, 72, 0.1); border: 1px dashed #e11d48; border-radius: 8px; color: #e11d48; font-size: 12px;">
                    <b>Nota Crítica:</b> Se detectaron ${fallos} puntos de acceso no autorizados. Es urgente configurar las RLS en Supabase.
                </div>
            ` : ''}
        </div>
    `;

    Swal.fire({
        title: 'Reporte de Investigación',
        html: htmlReporte,
        width: '500px',
        background: tema.bg,
        color: tema.txt,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#E11D48',
        customClass: { popup: 'mi-borde-redondeado' }
    });
};
const investigarSeguridad = async () => {
    const hallazgos = [];

    // PRUEBA 1: Lectura Anónima
    const { data: prueba1 } = await supabase.from('pedidos').select('id').limit(1);
    hallazgos.push({
        status: prueba1 ? 'error' : 'success',
        mensaje: "Acceso a la base de datos sin token.",
        recomendacion: prueba1 ? "Activa 'Row Level Security' (RLS) en el panel de Supabase." : "Los datos están ocultos a nivel de servidor."
    });

    // PRUEBA 2: Validación de Email (Tu instrucción crítica)
    // Verificamos si la tabla tiene restricciones de email único o login seguro
    const sesion = localStorage.getItem('usuario'); 
    hallazgos.push({
        status: sesion ? 'success' : 'error',
        mensaje: "Estado de la sesión local.",
        recomendacion: sesion ? "Sesión detectada correctamente." : "Cualquier usuario puede ver la interfaz. Implementa un guardián de ruta (Middleware)."
    });

    // PRUEBA 3: Protocolo de Conexión
    const isSecure = window.location.protocol === 'https:';
    hallazgos.push({
        status: isSecure ? 'success' : 'error',
        mensaje: "Cifrado de conexión (HTTPS).",
        recomendacion: isSecure ? "Conexión cifrada." : "Estás en HTTP (Localhost). Los datos viajan expuestos. Usa SSL en producción."
    });

    // Mostramos el reporte final
    window.mostrarReporteSeguridad(hallazgos);
};