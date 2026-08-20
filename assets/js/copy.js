{{ $src := partial "utils/lib.html" (dict "$" . "type" "clipboard") }}

// Copy Button for Code Blocks

// References
// 1. https://tomspencer.dev/blog/2018/09/14/adding-click-to-copy-buttons-to-a-hugo-powered-blog/
// 2. https://www.dannyguo.com/blog/how-to-add-copy-to-clipboard-buttons-to-code-blocks-in-hugo/

window.addEventListener("DOMContentLoaded", event => {
    const copyText = '{{ i18n "copy" }}';
    const copiedText = '{{ i18n "copied" }}';
    const copyIcon = '{{ partial "utils/icon.html" (dict "$" . "name" "copy" "class" "copy-icon") }}';

    document.querySelectorAll('.post-body > pre').forEach((e) => {
        const div = document.createElement('div');
        e.parentNode.replaceChild(div, e);
        div.appendChild(e);
    });

    function getCodeBlock(containerEl) {
        if (containerEl.classList.contains('codeblock')) {
            const table = containerEl.querySelector('table.lntable');
            if (table) {
                const cells = table.querySelectorAll('.lntd');
                return cells.length > 1 ? cells[1] : table;
            }
            return containerEl.querySelector('pre code') || containerEl.querySelector('code') || containerEl;
        }

        if (containerEl.classList.contains('lntable')) {
            return containerEl.querySelectorAll('.lntd')[1] || containerEl;
        }

        return containerEl.querySelector('code') || containerEl;
    }

    function setupCopyButton(containerEl, clipboard) {
        const isCodeblock = containerEl.classList.contains('codeblock');
        const button = isCodeblock
            ? containerEl.querySelector('.copy-button')
            : document.createElement('button');

        if (!button) {
            return;
        }

        if (!isCodeblock) {
            containerEl.parentNode.style.position = 'relative';
            button.className = 'copy-button';
            button.type = 'button';
            containerEl.appendChild(button);
        }

        const codeBlock = getCodeBlock(containerEl);
        button.innerHTML = copyIcon;
        button.setAttribute('aria-label', copyText);
        button.setAttribute('data-state', 'copy');

        button.addEventListener('click', () => {
            clipboard.writeText(codeBlock.innerText).then(() => {
                /* Chrome doesn't seem to blur automatically,
                   leaving the button in a focused state. */
                button.blur();

                button.setAttribute('aria-label', copiedText);
                button.setAttribute('data-state', 'copied');
                button.classList.add('is-copied');

                setTimeout(() => {
                    button.setAttribute('aria-label', copyText);
                    button.setAttribute('data-state', 'copy');
                    button.classList.remove('is-copied');
                }, 1000);
            }).catch((error) => {
                button.setAttribute('aria-label', 'Error');
                button.setAttribute('data-state', 'error');

                console.error(error);
            });
        });

        {{ if .Site.Params.enableCopyAutoHide }}
            if (!isCodeblock) {
                containerEl.parentNode.addEventListener('mouseover', () => {
                    button.style = 'visibility: visible; opacity: 1';
                });

                containerEl.parentNode.addEventListener('mouseout', () => {
                    button.style = 'visibility: hidden; opacity: 0';
                });
            }
        {{ end }}
    }

    function addCopyButtons(clipboard) {
        document.querySelectorAll('.codeblock, table.lntable, .highlight > pre, .post-body > div > pre').forEach((containerEl) => {
            if (!containerEl.classList.contains('codeblock') && containerEl.closest('.codeblock')) {
                return;
            }

            setupCopyButton(containerEl, clipboard);
        });
    }

    if (navigator && navigator.clipboard) {
        addCopyButtons(navigator.clipboard);
    } else {
        const script = document.createElement('script');
        script.src = '{{ $src }}';
        script.defer = true;
        script.onload = function() {
            addCopyButtons(clipboard);
        };

        document.head.appendChild(script);
    }
}, {once: true});
