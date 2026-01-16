const VERSION_SISTEMA = '1.3.0';

const limpiarLocalStorageAntiguo = () => {
    const versionGuardada = localStorage.getItem('seenChangelogVersion');

    if (versionGuardada !== VERSION_SISTEMA) {
        // Solo estos 4 se salvan de la eliminación
        const camposAKeep = ['usuario', 'tutorialVisto', 'tema-usuario', 'foto-perfil'];
        const llavesActuales = Object.keys(localStorage);

        llavesActuales.forEach(llave => {
            if (!camposAKeep.includes(llave)) {
                localStorage.removeItem(llave);
            }
        });

        localStorage.setItem('seenChangelogVersion', VERSION_SISTEMA);
        
        Swal.fire({
            title: 'Perfil Optimizado',
            text: 'Se han limpiado los datos antiguos del sistema.',
            icon: 'success',
            timer: 2500,
            showConfirmButton: false
        });
    }
};

document.addEventListener('DOMContentLoaded', limpiarLocalStorageAntiguo);