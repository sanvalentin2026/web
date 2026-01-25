const VERSION_SISTEMA = '1.4.0 | SAE-1';

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
    }
};

document.addEventListener('DOMContentLoaded', limpiarLocalStorageAntiguo);