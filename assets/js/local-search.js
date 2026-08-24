/* 本地全文搜索客户端：首次使用时懒加载 search/index.json，
   多词（空白分隔、AND）子串匹配，结果渲染到头部下拉面板。
   中文不做分词，直接子串匹配，避免分词误差。
   与 layouts/partials/components/search.html 的 data-search 表单配套。 */
function initLocalSearch() {
    const form = document.getElementById('search');
    if (!form || !form.hasAttribute('data-search')) {
        return;
    }

    const input = document.getElementById('search-input');
    const panel = document.getElementById('search-results');

    const indexURL = '{{ "search/index.json" | relURL }}';
    const noResultText = '{{ i18n "searchNoResults" }}';

    let docs = null;
    let seq = 0;
    let timer = null;

    const load = async () => {
        if (!docs) {
            docs = await (await fetch(indexURL)).json();
        }
        return docs;
    };

    const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
    const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isAscii = (s) => /^[\u0000-\u007f]+$/.test(s);

    const findIn = (term, text) => {
        if (isAscii(term)) {
            const m = new RegExp('(^|[^a-z0-9])' + escapeReg(term), 'i').exec(text);
            return m ? m.index + m[1].length : -1;
        }
        return text.toLowerCase().indexOf(term.toLowerCase());
    };

    const highlight = (text, terms) => {
        const ranges = [];
        for (const term of terms) {
            let from = 0;
            while (from < text.length) {
                const p = findIn(term, text.slice(from));
                if (p === -1) {
                    break;
                }
                ranges.push([from + p, from + p + term.length]);
                from += p + term.length;
            }
        }
        ranges.sort((a, b) => a[0] - b[0]);
        let out = '';
        let last = 0;
        for (const [s, e] of ranges) {
            if (s < last) {
                continue;
            }
            out += escapeHtml(text.slice(last, s)) + '<mark>' + escapeHtml(text.slice(s, e)) + '</mark>';
            last = e;
        }
        return out + escapeHtml(text.slice(last));
    };

    const close = () => {
        panel.hidden = true;
        panel.innerHTML = '';
    };

    const run = async () => {
        const q = input.value.trim();
        const id = ++seq;
        if (!q) {
            close();
            return;
        }
        const terms = q.split(/\s+/).filter(Boolean);
        form.setAttribute('data-running', '');
        let hits = [];
        try {
            const all = await load();
            hits = all.map((doc) => {
                let score = 0;
                let pos = -1;
                for (const term of terms) {
                    const tp = findIn(term, doc.t);
                    const bp = findIn(term, doc.b);
                    if (tp === -1 && bp === -1) {
                        return null;
                    }
                    if (tp !== -1) {
                        score += 5;
                    }
                    if (bp !== -1) {
                        score += 1;
                        if (pos === -1) {
                            pos = bp;
                        }
                    }
                }
                return { doc, score, pos };
            }).filter(Boolean);
            hits.sort((a, b) => b.score - a.score);
            hits = hits.slice(0, 8);
        } catch (error) {
            hits = [];
        } finally {
            form.removeAttribute('data-running');
        }
        if (id !== seq) {
            return;
        }
        panel.innerHTML = '';
        if (!hits.length) {
            const div = document.createElement('div');
            div.className = 'search-no-result';
            div.textContent = noResultText;
            panel.appendChild(div);
            panel.hidden = false;
            return;
        }
        for (const { doc, pos } of hits) {
            const start = pos === -1 ? 0 : Math.max(0, pos - 30);
            const windowText = (start > 0 ? '…' : '') + doc.b.slice(start, start + 110);
            const a = document.createElement('a');
            a.className = 'search-result-item';
            a.href = doc.u;
            const title = document.createElement('span');
            title.className = 'search-result-title';
            title.textContent = doc.t;
            const excerpt = document.createElement('span');
            excerpt.className = 'search-result-excerpt';
            excerpt.innerHTML = highlight(windowText, terms);
            a.appendChild(title);
            a.appendChild(excerpt);
            panel.appendChild(a);
        }
        panel.hidden = false;
    };

    form.addEventListener('submit', (event) => event.preventDefault());

    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(run, 150);
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !panel.hidden) {
            const first = panel.querySelector('a');
            if (first) {
                event.preventDefault();
                first.click();
            }
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            close();
            input.blur();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            input.focus();
        }
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-container')) {
            close();
        }
    });
}

document.addEventListener('meme:app-ready', initLocalSearch);
