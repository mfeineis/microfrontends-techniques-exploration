customElements.define("ca-cover", class extends HTMLElement {
    static get observedAttributes() {
        return ["bg-primary"];
    }
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
        const bg = this.hasAttribute("bg-primary") ? "bg:primary-highlight" : "";
        const root = this.shadowRoot;
        root.innerHTML = /*html*/`
        <style>
        :host {
            display: flex;
            flex-direction: column;
            max-width: none !important;
            min-height: calc(100vh - 2 * var(--s1));
            padding: var(--s1);
        }
        :host > * {
            margin-bottom: var(--s1);
            margin-top: var(--s1);
        }
        :host > :first-child:not(.centered) {
            margin-top: 0;
        }
        :host > :last-child:not(.centered) {
            margin-bottom: 0;
        }
        :host > .centered {
            margin-bottom: auto;
            margin-top: auto;
        }
        </style>
        <template class="${bg}">
            <slot></slot>
            <div class="centered">
                <slot name="center"></slot>
            </div>
        </template>
        `;
        const template = root.querySelector("template");
        this.classList = template.classList;
        root.appendChild(template.content.cloneNode(true));
    }
});