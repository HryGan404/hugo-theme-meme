function updateState() {
    let hasInstance = document.getElementById("instance").value.trim() != "";
    document.getElementById("submit").disabled = !hasInstance;
}

function getSoftwareName(instance) {
    for (let option of document.querySelectorAll("#fediverse-domains > option"))
        if (option.value == instance)
            return Promise.resolve(option.getAttribute("data-project"));

    const SUPPORTED_SCHEMAS = [
        "http://nodeinfo.diaspora.software/ns/schema/2.0",
        "http://nodeinfo.diaspora.software/ns/schema/2.1",
    ];
    return fetch(`https://${instance}/.well-known/nodeinfo`).then(response => response.json()).then(response => {
        if (response && Array.isArray(response.links))
            for (let link of response.links)
                if (SUPPORTED_SCHEMAS.includes(link.rel) && typeof link.href == "string")
                    return fetch(link.href);
        throw new Exception(".well-known/nodeinfo file does not contain a nodeinfo link");
    }).then(response => response.json()).then(response => {
        if (response && response.software && typeof response.software.name == "string")
            return response.software.name;
        throw new Exception("nodeinfo link does not contain a software name");
    }).catch(error => {
        console.error(error);

        // Download probably failed due to CORS error, assume Mastodon or compatible
        return "mastodon";
    });
}

function initFedishare(root) {
    const getElement = (id) => root.querySelector(`#${id}`);
    if (!getElement('shareForm')) {
        return;
    }

    let params = new URLSearchParams(location.hash.slice(1));
    getElement("title").value = params.get("title");
    getElement("url").value = params.get("url");

    let description = params.get("description") || '';
    if (description.length > 250)
        description = description.slice(0, 249) + "…";
    getElement("description").value = description;

    if ("mastodonInstance" in localStorage) {
        getElement("instance").value = localStorage.mastodonInstance;
        getElement("rememberInstance").checked = true;
    }

    getElement("shareForm").addEventListener("submit", event => {
        event.preventDefault();

        if (event.target.disabled)
            return;

        let instance = getElement("instance").value.trim();

        // Fix URLs mistakenly entered into the instance field
        instance = instance.replace(/^\w+:[\/\\]*/, "");
        instance = instance.replace(/[\/\\].*/, "");
        getElement("instance").value = instance;

        if (instance == "")
            return;

        if (getElement("rememberInstance").checked)
            localStorage.mastodonInstance = instance;
        else
            delete localStorage.mastodonInstance;

        let title = getElement("title").value.trim();
        let description = getElement("description").value.trim();
        let url = getElement("url").value.trim();
        let text = title + "\n" + description + "\n" + url;

        getSoftwareName(instance).then(name => {
            let projects = JSON.parse(document.body.getAttribute("data-projects"));
            let endpoint = projects.hasOwnProperty(name) ? projects[name] : projects.mastodon;
            endpoint = endpoint.replace("{title}", encodeURIComponent(title));
            endpoint = endpoint.replace("{description}", encodeURIComponent(description));
            endpoint = endpoint.replace("{url}", encodeURIComponent(url));
            endpoint = endpoint.replace("{text}", encodeURIComponent(text));
            location.href = `https://${instance}/${endpoint}`;
        });
    });

    getElement("instance").addEventListener("input", updateState);
    updateState();
}

document.addEventListener('meme:page-ready', (event) => {
    initFedishare(event.detail.root);
});
