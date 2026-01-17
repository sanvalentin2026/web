// Utilidades globales para rendimiento y estabilidad
(function(global){
    function debounce(fn, wait = 200) {
        let t;
        return function(...args) {
            const ctx = this;
            clearTimeout(t);
            t = setTimeout(() => fn.apply(ctx, args), wait);
        };
    }

    function throttle(fn, limit = 250) {
        let inThrottle;
        let lastFn;
        let lastTime;
        return function(...args) {
            const ctx = this;
            if (!inThrottle) {
                fn.apply(ctx, args);
                lastTime = Date.now();
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                    if (lastFn) {
                        lastFn.apply(ctx, args);
                        lastFn = null;
                    }
                }, limit);
            } else {
                lastFn = fn.bind(ctx, ...args);
            }
        };
    }

    function runIdle(fn) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(fn, {timeout: 1000});
        } else {
            setTimeout(fn, 200);
        }
    }

    global.utils = { debounce, throttle, runIdle };
})(window);
