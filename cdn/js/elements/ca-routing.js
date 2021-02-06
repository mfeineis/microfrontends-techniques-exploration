Core.use(function (Y) {
    const Object_keys = Object.keys;

    const document = Y.env.document;
    const window = Y.env.window;
    const customElements = window.customElements;

    let initialized = false;

    customElements.define("ca-routing", class extends HTMLElement {
        connectedCallback() {
            if (initialized) {
                return;
            }
            initialized = true;
            setupRouting();
            setupDocumentLoading();
        }
    });

    function setupRouting() {
        const routeHistory = [];
    
        document.addEventListener("click", function (evt) {
            // Y.log("evt", evt.target, evt.currentTarget, evt);
    
            const hasHash = /#/.test(evt.target.href);
            let hasHashChange = routeHistory.length === 0;
            (evt.target.href || "").replace(/#(.+)/, function (_, hash) {
                hasHashChange = routeHistory[routeHistory.length - 1].hash !== hash;
            });
            const usesRouting =
                evt.target && evt.target.href && evt.target.getAttribute("target") !== "_self" && (
                    evt.target.href.indexOf(window.location.origin) === 0
                ) && (!hasHash || hasHashChange);
    
            if (usesRouting) {
                evt.preventDefault();
                evt.stopPropagation();
                window.history.pushState(null, document.title, evt.target.href)
            }
        });
    
        const nativePushState = window.history.pushState;
    
        window.history.pushState = function pushState(data, title, url) {
            // Y.log("[INFO] pushState()", data, title, url);
            nativePushState.call(window.history, data, title, url);
            checkRoute();
        };
    
        function checkRoute() {
            // Y.log("checkRoute", document.location)
            const lastEvt = routeHistory[routeHistory.length - 1];
            const pathname = document.location.pathname;
            const evt = {
                hash: (document.location.hash || "").replace(/#/, ""),
                href: document.location.href,
                params: {},
                path: pathname.split("/").slice(1),
                pathname: pathname,
                origin: document.location.origin,
            };
            (document.location.search || "").replace(/([^&?]+)=([^&?]+)/, function (_, key, value) {
                evt.params[key] = value;
                return _;
            });
            const hasChanged =
                JSON.stringify(routeHistory[routeHistory.length - 1]) !== JSON.stringify(evt);
    
            if (hasChanged) {
                routeHistory.push(evt);
                Y.emit("route.changed", [evt, lastEvt]);
            }
            // Y.log("routeHistory", routeHistory);
        }
    
        window.addEventListener("popstate", function onpopstate(ev) {
            // Y.log("[INFO] window.onpopstate", ev);
            checkRoute();
        });
    
        // Y.log("[INFO] initRouting()");
        checkRoute();
    }

    function setupDocumentLoading() {
        const SENTINEL = { you: "shallNotPass" };

        const EXPANDO = "__core_" + (Date.now() + "_" + String(Math.random()).slice(1).replace(/\D/g, "")) + "__";
        const globalsWhitelist = Object_keys(window).reduce(function (acc, cur) {
            acc[cur] = cur;
            return acc;
        }, {});

        function isTransferable(node) {
            return node.parentNode.tagName.toUpperCase() === "BODY" ||
                (node.parentNode.tagName.toUpperCase() === "HEAD" && node.tagName.toUpperCase() === "TITLE");
        }

        function removeChildren(node) {
            // Y.log("[INFO] removeChildren(", node, ")");
            while (node.childNodes.length) {
                node.removeChild(node.firstChild);
            }
        }

        function onDomReady(fn) {
            if (document.readyState !== "loading") {
                fn();
            } else {
                document.addEventListener("DOMContentLoaded", function () {
                    fn();
                });
            }
        }

        function loadDocument(html) {
            // Y.log("[INFO] Removing global remnants...");

            removeChildren(document.body);

            Object_keys(window).forEach(function (key) {
                if (!globalsWhitelist[key]) {
                    const maybeCoreGlobal = window[key];

                    if (maybeCoreGlobal === Core) {
                        return;
                    }

                    // Y.log("[INFO] > Deleting", key, "...");
                    delete window[key];
                }
            });

            let headerNodes = document.querySelectorAll("head > *");
            let i = 0;
            while (i < headerNodes.length) {
                const node = headerNodes[i];
                if (node[EXPANDO] !== SENTINEL) {
                    //api.log("[INFO] > Removing <head> node", node);
                    node.parentNode.removeChild(node);
                }
                i += 1;
            }
            headerNodes = null;

            const header = document.querySelector("head");
            headerNodes = html.querySelectorAll("head > *");
            i = 0;
            while (i < headerNodes.length) {
                //api.log("[INFO] Appending <head> node", headerNodes[i]);
                const node = headerNodes[i];
                if (isTransferable(node)) {
                    header.appendChild(node.cloneNode(true));
                }
                i += 1;
            }
            headerNodes = null;

            let newBody = html.querySelectorAll("body > *");
            i = 0;
            while (i < newBody.length) {
                //api.log("[INFO] Appending <body> node", newBody[i]);
                let original = newBody[i];
                let node;

                if (original.tagName.toUpperCase() === "SCRIPT") {
                    // https://stackoverflow.com/questions/28771542/why-dont-clonenode-script-tags-execute 
                    node = document.createElement('script');
                    node.async = original.async;
                    node.crossOrigin = original.crossOrigin;
                    node.defer = original.defer;
                    // node.integrity = original.integrity;
                    node.noModule = original.noModule;
                    // node.nonce = original.nonce;
                    // node.referrerPolicy = original.referrerPolicy;
                    // node.type = original.type;
                    original.src && (node.src = original.src);
                    original.innerHTML && (node.innerHTML = original.innerHTML);
                    document.body.appendChild(node);

                    if (node.tagName.toUpperCase() === "SCRIPT" && node.hasAttribute("src")) {
                        // FIXME: Adjust baseUrl for resources!
                        //node.src = baseUrl + node.src;
                    }
                } else {
                    node = original.cloneNode(true);
                }
                original = null;

                document.body.appendChild(node);
                node = null;
                i += 1;
            }
            newBody = null;
        }

        onDomReady(function () {
            let headerNodes = document.querySelectorAll("head > *");
            let i = 0;
            while (i < headerNodes.length) {
                const current = headerNodes[i];
                if (isTransferable(current)) {
                    i += 1;
                    continue;
                }
                current[EXPANDO] = SENTINEL;
                i += 1;
            }
            headerNodes = null;
        });

        Y.on("route.changed", function (data) {
            // Y.log("route.changed", JSON.stringify(data));
            const current = data[0];
            const last = data[1];

            if (!last) {
                // Y.log("initial route");
                Y.emit("page.load.finished", current);
                Y.emit("page.loaded", current);
                return;
            }

            if (current.path[0] === last.path[0]) {
                // Y.log("pathname did not change", current.pathname);
                Y.emit("page.load.finished", current);
                return;
            }

            // Y.log(last, "=>", current);
            Y.emit("page.load.initiated", current);
            Y.request(current.pathname, { responseType: "document" }, function (err, response) {
                if (err) {
                    Y.log.error(err);
                    Y.emit("page.load.finished", current);
                    Y.emit("page.load.failed", current);
                    return;
                }
                Y.emit("page.unload.initiated", current);
                // Y.log("responseXML", response.responseXML)
                loadDocument(response.responseXML);
                Y.emit("page.load.finished", current);
                Y.emit("page.loaded", current);
            });

            // request(route.entry, { responseType: "document" }
        });
    }
});