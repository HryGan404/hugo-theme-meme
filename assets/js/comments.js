function initComments(root) {
    {{ if .Site.Params.autoLoadComments }}
        if (typeof loadComments === 'function') {
            loadComments()
        }
    {{ else }}
        const commentsToggle = root.querySelector('#load-comments');

        if (commentsToggle !== null) {
            commentsToggle.addEventListener('click', function () {
                loadComments();
                this.style = "display: none";
            });
        }
    {{  end }}
}

document.addEventListener('meme:page-ready', (event) => {
    initComments(event.detail.root);
});
