let disposeToc = () => {};

function initToc(root) {
    disposeToc();

    const toc = root.querySelector('.post-toc-desktop');
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
        root.querySelectorAll(
            '.post-body h2[id], .post-body h3[id], .post-body h4[id], .post-body h5[id], .post-body h6[id]'
        )
    ).filter((heading) => byHash.has(heading.id));

    if (!headings.length) {
        return;
    }

    const header = document.querySelector('.header-wrapper');
    const headerOffset = header ? header.getBoundingClientRect().height : 0;

    const contents = toc.querySelector('.contents');
    const indicator = document.createElement('span');
    indicator.className = 'toc-indicator';
    contents.prepend(indicator);

    const setActive = (hash) => {
        const activeLink = byHash.get(hash) || links[0];
        indicator.style.transform = `translateY(${activeLink.offsetTop}px)`;
        indicator.style.height = `${activeLink.offsetHeight}px`;
        indicator.classList.add('visible');

        if (activeLink.classList.contains('active')) {
            return;
        }

        links.forEach((link) => link.classList.remove('active'));
        activeLink.classList.add('active');
    };

    let observer = null;
    let ticking = false;
    const intersectingHeadings = new Set();

    const updateFromScroll = () => {
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

    const requestScrollUpdate = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateFromScroll);
        }
    };

    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    intersectingHeadings.add(entry.target);
                } else {
                    intersectingHeadings.delete(entry.target);
                }
            });

            const visible = headings
                .filter((heading) => intersectingHeadings.has(heading))
                .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

            if (visible.length) {
                setActive(visible[0].id);
                return;
            }

            updateFromScroll();
        }, {
            rootMargin: `-${headerOffset + 8}px 0px -65% 0px`,
            threshold: 0
        });

        headings.forEach((heading) => observer.observe(heading));
    } else {
        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
        window.addEventListener('resize', requestScrollUpdate, { passive: true });
    }

    updateFromScroll();

    disposeToc = () => {
        if (observer) {
            observer.disconnect();
            observer = null;
        } else {
            window.removeEventListener('scroll', requestScrollUpdate);
            window.removeEventListener('resize', requestScrollUpdate);
        }
        indicator.remove();
        disposeToc = () => {};
    };
}

document.addEventListener('meme:page-before-swap', () => {
    disposeToc();
});

document.addEventListener('meme:page-ready', (event) => {
    initToc(event.detail.root);
});
