window.addEventListener('DOMContentLoaded', () => {
    const toc = document.querySelector('.post-toc-desktop');
    if (!toc) {
        return;
    }

    const links = Array.from(toc.querySelectorAll('.contents a[href^="#"]'));
    if (!links.length) {
        return;
    }

    const byHash = new Map();
    links.forEach((link) => {
        let hash = link.getAttribute('href').slice(1);
        try {
            hash = decodeURIComponent(hash);
        } catch (error) {
            // Keep the raw hash when it is not percent-encoded.
        }
        byHash.set(hash, link);
    });

    const headings = Array.from(
        document.querySelectorAll(
            '.post-body h2[id], .post-body h3[id], .post-body h4[id], .post-body h5[id], .post-body h6[id]'
        )
    ).filter((heading) => byHash.has(heading.id));

    if (!headings.length) {
        return;
    }

    const header = document.querySelector('.header-wrapper');
    let ticking = false;

    const setActive = (hash) => {
        links.forEach((link) => link.classList.remove('active'));
        const link = byHash.get(hash);
        if (link) {
            link.classList.add('active');
        } else if (links.length) {
            links[0].classList.add('active');
        }
    };

    const update = () => {
        const headerOffset = header ? header.getBoundingClientRect().height : 0;
        const offset = headerOffset + 8;
        let current = headings[0].id;

        for (const heading of headings) {
            if (heading.getBoundingClientRect().top <= offset) {
                current = heading.id;
            } else {
                break;
            }
        }

        setActive(current);
        ticking = false;
    };

    const requestTick = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick, { passive: true });
    update();
});
