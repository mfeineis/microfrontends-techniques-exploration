Core.use(function (Y) {
    const window = Y.env.window;
    const document = Y.env.document;
    const customElements = window.customElements;

    // TODO: Do we need a common way for retrieving configuration?
    const config = {
        baseUrl: "/cdn/js/elements/",
    };
    const known = { "ca-import": true };

    function importElement(name) {
        if (known[name]) {
            // Y.log("importElement(", name, ") skipped, already loaded");
            return;
        }
        // Y.log("importElement(", name, ")...", config);
        known[name] = true;
        const node = document.createElement("script");
        node.src = `${config.baseUrl}${name}.js`;
        node.dataset.context = "ca-import";
        document.head.insertBefore(node, document.head.lastChild);
        Y.log("..imported", customElements.get(name), known);
    }

    customElements.define("ca-import", class extends HTMLElement {
        static get observedAttributes() {
            return ["elements"];
        }
        attributeChangedCallback(name, oldValue, value) {
            // Y.log("attributeChanged", name, oldValue, "=>", value);
            for (let element of value.split(',')) {
                importElement(element.trim());
            }
        }
    });
});