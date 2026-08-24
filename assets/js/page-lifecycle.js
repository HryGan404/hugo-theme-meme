(() => {
    const appReadyEvent = 'meme:app-ready';
    const pageBeforeSwapEvent = 'meme:page-before-swap';
    const pageReadyEvent = 'meme:page-ready';

    function emit(name, detail = {}) {
        document.dispatchEvent(new CustomEvent(name, { detail }));
    }

    window.memePage = {
        beforeSwap(root = document.querySelector('#main'), url = location.href) {
            emit(pageBeforeSwapEvent, { root, url });
        },

        ready(root = document.querySelector('#main'), url = location.href) {
            if (!root) {
                return;
            }
            emit(pageReadyEvent, { root, url });
        }
    };

    function boot() {
        emit(appReadyEvent, { url: location.href });
        window.memePage.ready();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
