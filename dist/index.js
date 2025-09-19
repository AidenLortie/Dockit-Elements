// Simple string hash (djb2)
function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36); // convert to base36 for shorter hash
}
const StyleRegistry = new Map(); // Maps styleHash -> className
let globalCounter = 0; // Global counter for unique identifiers, should a value be required more than once, the
// number should be saved and reused.
const registerOrGetClassName = (style) => {
    const toKebabCase = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    // Normalize style keys → kebab-case
    const convertStyleKeys = (obj) => {
        const newObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[toKebabCase(key)] = obj[key];
            }
        }
        return newObj;
    };
    style.default = convertStyleKeys(style.default);
    if (style.pseudo) {
        for (const pseudo in style.pseudo) {
            if (style.pseudo.hasOwnProperty(pseudo)) {
                style.pseudo[pseudo] = convertStyleKeys(style.pseudo[pseudo]);
            }
        }
    }
    if (style.media) {
        for (const media in style.media) {
            if (style.media.hasOwnProperty(media)) {
                style.media[media] = convertStyleKeys(style.media[media]);
            }
        }
    }
    // Stable hash based on content
    const styleString = JSON.stringify(style);
    const styleHash = hashString(styleString);
    // Always use a unique class name based on style hash
    const className = `dockit-${styleHash}`;
    if (!StyleRegistry.has(className)) {
        StyleRegistry.set(className, styleString);
    }
    return className;
};
const reservedPropKeys = new Set(['id', 'className', 'style', 'events']);
export class DockitElementRoot {
    container;
    root;
    lastRoot;
    constructor(container, root) {
        this.container = container;
        this.root = root;
    }
    render() {
        this.container.innerHTML = ''; // Clear existing content
        const dom = this.root.render(); // Render first to register styles
        this.injectStyles(); // Inject styles after registration, before DOM attach
        this.container.appendChild(dom);
    }
    update() {
        if (!this.lastRoot || JSON.stringify(this.root) !== JSON.stringify(this.lastRoot)) {
            this.root.update();
        }
    }
    destroy() {
        // TODO
    }
    replace(newRoot) {
        this.lastRoot = this.root;
        this.root = newRoot;
        this.render();
    }
    injectStyles() {
        const dockitStyleElementId = 'dockit-styles';
        let styleElement = document.getElementById(dockitStyleElementId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = dockitStyleElementId;
            document.head.appendChild(styleElement);
        }
        // Keep track of which classes we already injected
        const injected = new Set(Array.from(styleElement.sheet?.cssRules ?? []).map(rule => rule.selectorText?.replace('.', '') ?? ''));
        // Only add new styles
        StyleRegistry.forEach((styleString, className) => {
            if (injected.has(className))
                return; // already exists
            const styleObj = JSON.parse(styleString);
            // Default styles
            let rule = `.${className} {`;
            for (const [key, value] of Object.entries(styleObj.default)) {
                rule += `${key}: ${value};`;
            }
            rule += `}`;
            styleElement.sheet?.insertRule(rule, styleElement.sheet.cssRules.length);
            // Pseudo selectors
            if (styleObj.pseudo) {
                for (const [pseudo, pseudoStyles] of Object.entries(styleObj.pseudo)) {
                    let pseudoRule = `.${className}${pseudo} {`;
                    for (const [key, value] of Object.entries(pseudoStyles)) {
                        pseudoRule += `${key}: ${value};`;
                    }
                    pseudoRule += `}`;
                    styleElement.sheet?.insertRule(pseudoRule, styleElement.sheet.cssRules.length);
                }
            }
            // Media queries
            if (styleObj.media) {
                for (const [mediaQuery, mediaStyles] of Object.entries(styleObj.media)) {
                    let mediaRule = `@media ${mediaQuery} { .${className} {`;
                    for (const [key, value] of Object.entries(mediaStyles)) {
                        mediaRule += `${key}: ${value};`;
                    }
                    mediaRule += `} }`;
                    styleElement.sheet?.insertRule(mediaRule, styleElement.sheet.cssRules.length);
                }
            }
            // Animations
            if (styleObj.animation) {
                const { keyframes, options } = styleObj.animation;
                // Insert keyframes
                for (const [keyframeName, keyframeStyles] of Object.entries(keyframes)) {
                    let keyframeRule = `@keyframes ${keyframeName} {`;
                    for (const [percent, styles] of Object.entries(keyframeStyles)) {
                        keyframeRule += `${percent} {`;
                        for (const [key, value] of Object.entries(styles)) {
                            keyframeRule += `${key}: ${value};`;
                        }
                        keyframeRule += `}`;
                    }
                    keyframeRule += `}`;
                    styleElement.sheet?.insertRule(keyframeRule, styleElement.sheet.cssRules.length);
                }
                // Animation options
                const names = options.name
                    ? (Array.isArray(options.name) ? options.name.join(", ") : options.name)
                    : Object.keys(keyframes).join(", "); // fallback
                let animationRule = `.${className} { animation-name: ${names};`;
                if (options.duration)
                    animationRule += ` animation-duration: ${options.duration}ms;`;
                if (options.easing)
                    animationRule += ` animation-timing-function: ${options.easing};`;
                if (options.delay)
                    animationRule += ` animation-delay: ${options.delay}ms;`;
                if (options.iterations)
                    animationRule += ` animation-iteration-count: ${options.iterations};`;
                if (options.direction)
                    animationRule += ` animation-direction: ${options.direction};`;
                if (options.fillMode)
                    animationRule += ` animation-fill-mode: ${options.fillMode};`;
                animationRule += ` }`;
                styleElement.sheet?.insertRule(animationRule, styleElement.sheet.cssRules.length);
            }
        });
    }
}
export class Element {
    tagName;
    props;
    children;
    lastProps;
    lastChildren;
    _el; // cached rendered element
    constructor(children = [], props = {}, tagName) {
        this.tagName = tagName;
        this.props = props;
        this.lastProps = props.lastProps;
        this.children = children;
        this.lastChildren = children;
        this.onLoad();
    }
    onLoad() {
        if (!this.props.events)
            this.props.events = {};
        if (!this.props.events.load)
            this.props.events.load = () => {
            };
        this.props.events.load();
        return this;
    }
    render() {
        const el = document.createElement(this.tagName);
        // set id and className if provided
        if (this.props.id)
            el.id = this.props.id;
        else
            this.props.id = `dockit-${globalCounter++}`; // Assign a unique id if not provided
        if (this.props.className)
            el.className = this.props.className;
        // Set attributes and properties
        for (const [key, value] of Object.entries(this.props)) {
            if (reservedPropKeys.has(key))
                continue; // Skip reserved keys
            if (key in el) {
                // @ts-ignore
                el[key] = value;
            }
            else {
                el.setAttribute(key, value);
            }
        }
        // Handle styles
        if (this.props.style) {
            const className = registerOrGetClassName(this.props.style);
            el.classList.add(className);
        }
        // Handle events
        if (this.props.events) {
            for (const [event, handler] of Object.entries(this.props.events)) {
                el.addEventListener(event, handler);
            }
        }
        // Handle children
        for (const child of this.children) {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            }
            else {
                el.appendChild(child.render());
            }
        }
        this._el = el; // cache the rendered element
        return el;
    }
    update() {
        if (!this._el) {
            this.render();
            return;
        }
        // Type guard: only proceed if _el is HTMLElement
        if (!(this._el instanceof HTMLElement)) {
            return;
        }
        // Update props if they have changed
        if (JSON.stringify(this.props) !== JSON.stringify(this.lastProps)) {
            // Update id and className if changed
            if (this.props.id && this.props.id !== this.lastProps?.id) {
                this._el.id = this.props.id;
            }
            if (this.props.className && this.props.className !== this.lastProps?.className) {
                this._el.className = this.props.className;
            }
            // Update attributes and properties
            for (const [key, value] of Object.entries(this.props)) {
                if (reservedPropKeys.has(key))
                    continue; // Skip reserved keys
                if (key in this._el) {
                    // @ts-ignore
                    this._el[key] = value;
                }
                else {
                    this._el.setAttribute(key, value);
                }
            }
            // Handle styles
            if (this.props.style) {
                const className = registerOrGetClassName(this.props.style);
                if (!this._el.classList.contains(className)) {
                    this._el.classList.add(className);
                }
            }
            // Handle events
            if (this.props.events) {
                // Remove old event listeners
                if (this.lastProps?.events) {
                    for (const [event, handler] of Object.entries(this.lastProps.events)) {
                        this._el.removeEventListener(event, handler);
                    }
                }
                // Add new event listeners
                for (const [event, handler] of Object.entries(this.props.events)) {
                    this._el.addEventListener(event, handler);
                }
            }
            this.lastProps = { ...this.props }; // Update lastProps
        }
        // --- Granular children diffing ---
        const parent = this._el;
        const oldChildren = this.lastChildren || [];
        const newChildren = this.children;
        let domIdx = 0;
        for (let i = 0; i < newChildren.length; i++) {
            const newChild = newChildren[i];
            const oldChild = oldChildren[i];
            // Reference equality: if same instance, always update in place
            if (newChild === oldChild) {
                if (typeof newChild !== 'string' && newChild)
                    newChild.update();
                domIdx++;
                continue;
            }
            // Fallback to key/index logic for non-equal children
            const getKey = (child, idx) => (typeof child === 'object' && child?.props?.key != null) ? child.props.key : idx;
            const key = getKey(newChild, i);
            // Try to find a matching old child by key
            let foundIdx = -1;
            for (let j = 0; j < oldChildren.length; j++) {
                if (getKey(oldChildren[j], j) === key) {
                    foundIdx = j;
                    break;
                }
            }
            if (foundIdx !== -1) {
                const oldMatch = oldChildren[foundIdx];
                if (typeof newChild === 'string' && typeof oldMatch === 'string') {
                    if (newChild !== oldMatch) {
                        const textNode = document.createTextNode(newChild);
                        parent.replaceChild(textNode, parent.childNodes[domIdx]);
                        // No _el to update for text nodes
                    }
                }
                else if (typeof newChild !== 'string' && typeof oldMatch !== 'string') {
                    if (newChild === oldMatch) {
                        newChild._el = oldMatch._el;
                        newChild.update();
                    }
                    else {
                        // Key matches but instance is different: replace node and call render on new instance
                        const node = newChild.render();
                        parent.replaceChild(node, parent.childNodes[domIdx]);
                        newChild._el = node;
                    }
                }
                else {
                    const node = (typeof newChild === 'string') ? document.createTextNode(newChild) : newChild.render();
                    parent.replaceChild(node, parent.childNodes[domIdx]);
                    if (typeof newChild !== 'string' && node instanceof HTMLElement)
                        newChild._el = node;
                }
                domIdx++;
            }
            else {
                // New child, insert
                const node = (typeof newChild === 'string') ? document.createTextNode(newChild) : newChild.render();
                if (parent.childNodes[domIdx]) {
                    parent.insertBefore(node, parent.childNodes[domIdx]);
                }
                else {
                    parent.appendChild(node);
                }
                if (typeof newChild !== 'string' && node instanceof HTMLElement)
                    newChild._el = node;
                domIdx++;
            }
        }
        // Remove any extra old children
        while (parent.childNodes.length > newChildren.length) {
            parent.removeChild(parent.lastChild);
        }
        this.lastChildren = [...this.children]; // Store references
    }
}
// Content Sectioning
export const address = (children = [], props = {}) => new Element(children, props, "address");
export const article = (children = [], props = {}) => new Element(children, props, "article");
export const aside = (children = [], props = {}) => new Element(children, props, "aside");
export const footer = (children = [], props = {}) => new Element(children, props, "footer");
export const header = (children = [], props = {}) => new Element(children, props, "header");
export const h1 = (children = [], props = {}) => new Element(children, props, "h1");
export const h2 = (children = [], props = {}) => new Element(children, props, "h2");
export const h3 = (children = [], props = {}) => new Element(children, props, "h3");
export const h4 = (children = [], props = {}) => new Element(children, props, "h4");
export const h5 = (children = [], props = {}) => new Element(children, props, "h5");
export const h6 = (children = [], props = {}) => new Element(children, props, "h6");
export const hgroup = (children = [], props = {}) => new Element(children, props, "hgroup");
export const main = (children = [], props = {}) => new Element(children, props, "main");
export const nav = (children = [], props = {}) => new Element(children, props, "nav");
export const section = (children = [], props = {}) => new Element(children, props, "section");
export const search = (children = [], props = {}) => new Element(children, props, "search");
// Text content
export const blockquote = (children = [], props = {}) => new Element(children, props, "blockquote");
export const dd = (children = [], props = {}) => new Element(children, props, "dd");
export const div = (children = [], props = {}) => new Element(children, props, "div");
export const dl = (children = [], props = {}) => new Element(children, props, "dl");
export const dt = (children = [], props = {}) => new Element(children, props, "dt");
export const figcaption = (children = [], props = {}) => new Element(children, props, "figcaption");
export const figure = (children = [], props = {}) => new Element(children, props, "figure");
export const hr = (children = [], props = {}) => new Element(children, props, "hr");
export const li = (children = [], props = {}) => new Element(children, props, "li");
export const menu = (children = [], props = {}) => new Element(children, props, "menu");
export const ol = (children = [], props = {}) => new Element(children, props, "ol");
export const p = (children = [], props = {}) => new Element(children, props, "p");
export const pre = (children = [], props = {}) => new Element(children, props, "pre");
export const ul = (children = [], props = {}) => new Element(children, props, "ul");
// Inline text semantics
export const a = (children = [], props = {}) => new Element(children, props, "a");
export const abbr = (children = [], props = {}) => new Element(children, props, "abbr");
export const b = (children = [], props = {}) => new Element(children, props, "b");
export const bdi = (children = [], props = {}) => new Element(children, props, "bdi");
export const bdo = (children = [], props = {}) => new Element(children, props, "bdo");
export const br = (props = {}) => new Element([], props, "br");
export const cite = (children = [], props = {}) => new Element(children, props, "cite");
export const code = (children = [], props = {}) => new Element(children, props, "code");
export const data = (children = [], props = {}) => new Element(children, props, "data");
export const dfn = (children = [], props = {}) => new Element(children, props, "dfn");
export const em = (children = [], props = {}) => new Element(children, props, "em");
export const i = (children = [], props = {}) => new Element(children, props, "i");
export const kbd = (children = [], props = {}) => new Element(children, props, "kbd");
export const mark = (children = [], props = {}) => new Element(children, props, "mark");
export const q = (children = [], props = {}) => new Element(children, props, "q");
export const rp = (children = [], props = {}) => new Element(children, props, "rp");
export const rt = (children = [], props = {}) => new Element(children, props, "rt");
export const rtc = (children = [], props = {}) => new Element(children, props, "rtc");
export const ruby = (children = [], props = {}) => new Element(children, props, "ruby");
export const s = (children = [], props = {}) => new Element(children, props, "s");
export const samp = (children = [], props = {}) => new Element(children, props, "samp");
export const small = (children = [], props = {}) => new Element(children, props, "small");
export const span = (children = [], props = {}) => new Element(children, props, "span");
export const strong = (children = [], props = {}) => new Element(children, props, "strong");
export const sub = (children = [], props = {}) => new Element(children, props, "sub");
export const sup = (children = [], props = {}) => new Element(children, props, "sup");
export const time = (children = [], props = {}) => new Element(children, props, "time");
export const u = (children = [], props = {}) => new Element(children, props, "u");
export const varr = (children = [], props = {}) => new Element(children, props, "var");
export const wbr = (props = {}) => new Element([], props, "wbr");
// Image and multimedia
export const area = (props = {}) => new Element([], props, "area");
export const audio = (children = [], props = {}) => new Element(children, props, "audio");
export const img = (props = {}) => new Element([], props, "img");
export const map = (children = [], props = {}) => new Element(children, props, "map");
export const track = (props = {}) => new Element([], props, "track");
export const video = (children = [], props = {}) => new Element(children, props, "video");
// Embedded content
export const embed = (props = {}) => new Element([], props, "embed");
export const iframe = (children = [], props = {}) => new Element(children, props, "iframe");
export const fencedframe = (children = [], props = {}) => new Element(children, props, "fencedframe");
export const objectEl = (children = [], props = {}) => new Element(children, props, "object");
export const param = (props = {}) => new Element([], props, "param");
export const picture = (children = [], props = {}) => new Element(children, props, "picture");
export const source = (props = {}) => new Element([], props, "source");
// Svg and MathML
export const svg = (children = [], props = {}) => new Element(children, props, "svg");
export const math = (children = [], props = {}) => new Element(children, props, "math");
// Scripting
export const canvas = (children = [], props = {}) => new Element(children, props, "canvas");
export const noscript = (children = [], props = {}) => new Element(children, props, "noscript");
export const script = (children = [], props = {}) => new Element(children, props, "script");
// Demarcating edits
export const del = (children = [], props = {}) => new Element(children, props, "del");
export const ins = (children = [], props = {}) => new Element(children, props, "ins");
// Table content
export const caption = (children = [], props = {}) => new Element(children, props, "caption");
export const col = (props = {}) => new Element([], props, "col");
export const colgroup = (children = [], props = {}) => new Element(children, props, "colgroup");
export const table = (children = [], props = {}) => new Element(children, props, "table");
export const tbody = (children = [], props = {}) => new Element(children, props, "tbody");
export const td = (children = [], props = {}) => new Element(children, props, "td");
export const tfoot = (children = [], props = {}) => new Element(children, props, "tfoot");
export const th = (children = [], props = {}) => new Element(children, props, "th");
export const thead = (children = [], props = {}) => new Element(children, props, "thead");
export const tr = (children = [], props = {}) => new Element(children, props, "tr");
// Forms
export const button = (children = [], props = {}) => new Element(children, props, "button");
export const datalist = (children = [], props = {}) => new Element(children, props, "datalist");
export const fieldset = (children = [], props = {}) => new Element(children, props, "fieldset");
export const form = (children = [], props = {}) => new Element(children, props, "form");
export const input = (props = {}) => new Element([], props, "input");
export const label = (children = [], props = {}) => new Element(children, props, "label");
export const legend = (children = [], props = {}) => new Element(children, props, "legend");
export const meter = (children = [], props = {}) => new Element(children, props, "meter");
export const optgroup = (children = [], props = {}) => new Element(children, props, "optgroup");
export const option = (children = [], props = {}) => new Element(children, props, "option");
export const output = (children = [], props = {}) => new Element(children, props, "output");
export const progress = (children = [], props = {}) => new Element(children, props, "progress");
export const select = (children = [], props = {}) => new Element(children, props, "select");
export const selectedcontent = (children = [], props = {}) => new Element(children, props, "selectedcontent");
export const textarea = (children = [], props = {}) => new Element(children, props, "textarea");
// Interactive elements
export const details = (children = [], props = {}) => new Element(children, props, "details");
export const dialog = (children = [], props = {}) => new Element(children, props, "dialog");
export const summary = (children = [], props = {}) => new Element(children, props, "summary");
// Web Components *Note If you use these... you're already using a component system. Why?*
export const slot = (children = [], props = {}) => new Element(children, props, "slot");
export const template = (children = [], props = {}) => new Element(children, props, "template");
let count = 0;
// --- Reactive Counter Component ---
class Counter extends Element {
    count;
    constructor(initial = 0) {
        super([], {}, "div");
        this.count = initial;
        this.updateView();
    }
    increment = () => {
        console.log('Counter increment called, current count:', this.count);
        this.count++;
        this.updateView();
        this.update();
    };
    updateView() {
        this.children = [
            h1(["🔥 Interactive Demo"], { key: "counter-title" }),
            p(["Click the button to increase the counter:"], { key: "counter-desc" }),
            button([
                span([`Count: ${this.count}`], { key: "counter-span" })
            ], {
                id: "counter-btn",
                key: "counter-btn",
                events: { click: this.increment },
                style: {
                    default: {
                        background: "#28a745",
                        color: "#fff",
                        border: "none",
                        padding: "0.8rem 1.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginTop: "1rem",
                    },
                    pseudo: {
                        ":hover": { background: "#1e7e34" },
                    },
                },
            })
        ];
    }
}
// --- Single Counter instance for the demo ---
const counter = new Counter(0);
// --- Carousel Component ---
class Carousel extends Element {
    images;
    current;
    constructor(images) {
        super([], {}, "div");
        this.images = images;
        this.current = 0;
        this.updateView();
    }
    next = () => {
        this.current = (this.current + 1) % this.images.length;
        this.updateView();
        this.update();
    };
    prev = () => {
        this.current = (this.current - 1 + this.images.length) % this.images.length;
        this.updateView();
        this.update();
    };
    updateView() {
        this.children = [
            img({
                src: this.images[this.current],
                style: {
                    default: {
                        width: "400px",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        marginBottom: "1rem"
                    }
                },
                key: "carousel-img"
            }),
            div([
                button(["Previous"], {
                    events: { click: this.prev },
                    style: {
                        default: {
                            marginRight: "1rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "4px",
                            border: "none",
                            background: "#007bff",
                            color: "#fff",
                            cursor: "pointer"
                        },
                        pseudo: { ":hover": { background: "#0056b3" } }
                    },
                    key: "carousel-prev"
                }),
                button(["Next"], {
                    events: { click: this.next },
                    style: {
                        default: {
                            padding: "0.5rem 1rem",
                            borderRadius: "4px",
                            border: "none",
                            background: "#007bff",
                            color: "#fff",
                            cursor: "pointer"
                        },
                        pseudo: { ":hover": { background: "#0056b3" } }
                    },
                    key: "carousel-next"
                })
            ], { style: { default: { marginBottom: "1rem" } }, key: "carousel-controls" }),
            div([
                span([`${this.current + 1} / ${this.images.length}`], { key: "carousel-indicator" })
            ], { style: { default: { fontSize: "1rem", color: "#555" } }, key: "carousel-indicator-wrap" })
        ];
    }
}
// --- Single Carousel instance for the demo ---
const carousel = new Carousel([
    "https://placehold.co/400x200?text=Image+1",
    "https://placehold.co/400x200?text=Image+2",
    "https://placehold.co/400x200?text=Image+3"
]);
const LandingPage = () => div([
    header([
        h1(["Dockit - Lightweight UI Library"]), nav([
            a(["Home"], { href: "#", style: { default: { marginRight: "1rem" } } }),
            a(["Docs"], { href: "#", style: { default: { marginRight: "1rem" } } }),
            a(["GitHub"], {
                href: "github.com/aidenlortie/dockit-element",
                target: "_blank",
                style: { default: { marginRight: "1rem" } }
            }),
        ], { style: { default: { marginTop: "1rem" } } }),
    ], { style: { default: { textAlign: "center", padding: "2rem 1rem", background: "#f0f0f0" } } }),
    // --- Carousel Section (replaces hero) ---
    section([
        h1(["Image Carousel"]),
        carousel
    ], {
        style: {
            default: {
                textAlign: "center",
                padding: "4rem 1rem",
                background: "#e9f5ff",
            }
        }
    }),
    // Features Section with slideUp animation
    section([
        h1(["✨ Features"]),
        p(["Scoped styles, pseudo selectors, and media queries out-of-the-box!"]),
        div([
            div([p(["⚡ Fast Rendering"]), p(["Updates only when needed."])]),
            div([p(["🎨 Scoped Styles"]), p(["No global CSS collisions."])]),
            div([p(["📱 Responsive"]), p(["Media queries supported."])]),
        ], {
            style: {
                default: {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1.5rem",
                    padding: "0 2rem",
                },
            },
        }),
    ], {
        style: {
            default: {
                padding: "3rem 0",
                background: "#fff",
                textAlign: "center",
            },
            animation: {
                keyframes: {
                    slideUp: {
                        "0%": { transform: "translateY(30px)", opacity: "0" },
                        "100%": { transform: "translateY(0)", opacity: "1" },
                    },
                },
                options: {
                    name: "slideUp",
                    duration: 800,
                    easing: "ease-out",
                    fillMode: "forwards",
                },
            },
        },
    }),
    // --- Use the Counter component here ---
    section([
        counter
    ], {
        style: {
            default: {
                textAlign: "center",
                padding: "3rem 1rem",
                background: "#f8f9fa",
            },
        },
    }),
], {
    style: {
        default: {
            fontFamily: "sans-serif",
            lineHeight: "1.6",
            color: "#333",
        },
    },
});
// --- Mount to page ---
const container = document.getElementById("app");
const root = new DockitElementRoot(container, LandingPage());
root.render();
//# sourceMappingURL=index.js.map