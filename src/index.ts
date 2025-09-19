// Simple string hash (djb2)
function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36); // convert to base36 for shorter hash
}

const StyleRegistry = new Map<string, string>(); // Maps styleHash -> className
let globalCounter = 0; // Global counter for unique identifiers, should a value be required more than once, the
// number should be saved and reused.

const registerOrGetClassName = (style: DockitStyle, id?: string): string => {
    const toKebabCase = (str: string) =>
        str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

    // Normalize style keys → kebab-case
    const convertStyleKeys = (obj: { [key: string]: any }): { [key: string]: any } => {
        const newObj: { [key: string]: any } = {};
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

    // If user passed an explicit id, prefer it — otherwise dedupe with styleHash
    const className = id || `dockit-${styleHash}`;

    if (!StyleRegistry.has(className)) {
        StyleRegistry.set(className, styleString);
    }

    return className;
};

const reservedPropKeys = new Set(['id', 'className', 'style', 'events']);


export class DockitElementRoot {
    container: HTMLElement;
    root: Element;
    lastRoot?: Element;

    constructor(container: HTMLElement, root: Element) {
        this.container = container;
        this.root = root;
    }

    render() {
        this.container.innerHTML = ''; // Clear existing content
        this.container.appendChild(this.root.render());
        this.injectStyles();
    }

    update() {
        if (!this.lastRoot || JSON.stringify(this.root) !== JSON.stringify(this.lastRoot)) {
            this.root.update();
        }
    }

    destroy() {
        // TODO
    }

    replace(newRoot: Element) {
        this.lastRoot = this.root;
        this.root = newRoot;
        this.render();
    }

    injectStyles() {
        const dockitStyleElementId = 'dockit-styles';
        let styleElement = document.getElementById(dockitStyleElementId) as HTMLStyleElement;

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = dockitStyleElementId;
            document.head.appendChild(styleElement);
        }

        // Keep track of which classes we already injected
        const injected = new Set(
            Array.from(styleElement.sheet?.cssRules ?? []).map(rule =>
                (rule as CSSStyleRule).selectorText?.replace('.', '') ?? ''
            )
        );

        // Only add new styles
        StyleRegistry.forEach((styleString, className) => {
            if (injected.has(className)) return; // already exists

            const styleObj: DockitStyle = JSON.parse(styleString);

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
                const {keyframes, options} = styleObj.animation;

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
                if (options.duration) animationRule += ` animation-duration: ${options.duration}ms;`;
                if (options.easing) animationRule += ` animation-timing-function: ${options.easing};`;
                if (options.delay) animationRule += ` animation-delay: ${options.delay}ms;`;
                if (options.iterations) animationRule += ` animation-iteration-count: ${options.iterations};`;
                if (options.direction) animationRule += ` animation-direction: ${options.direction};`;
                if (options.fillMode) animationRule += ` animation-fill-mode: ${options.fillMode};`;
                animationRule += ` }`;

                styleElement.sheet?.insertRule(animationRule, styleElement.sheet.cssRules.length);
            }

        });
    }

}

type DockitStyle = {
    default: {
        [key: string]: string;
    },
    pseudo?: {
        [key: string]: {
            [key: string]: string;
        }
    },
    media?: {
        [key: string]: {
            [key: string]: string;
        }

    },
    animation?: {
        keyframes: {
            [key: string]: {
                [key: string]: { [key: string]: string }
            }
        },
        options: {
            name: string | string[];
            duration?: number;
            easing?: string;
            delay?: number;
            iterations?: number | 'infinite';
            direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
            fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
            playbackRate?: number;
        }
    }
}


type DockitProps = {
    id?: string;
    className?: string;
    style?: DockitStyle,
    events?: {
        [key: string]: (e?: Event) => void;
    },
    [key: string]: any; //for other attributes like href, src, alt, etc.
}

export class Element {
    tagName: string;
    props: DockitProps;
    children: Array<Element | string>;

    lastProps?: DockitProps;
    lastChildren?: Array<Element | string>;

    _el?: HTMLElement; // cached rendered element

    constructor(children: Array<Element | string> = [], props: DockitProps = {}, tagName: string) {
        this.tagName = tagName;
        this.props = props;
        this.lastProps = props.lastProps;
        this.children = children;
        this.lastChildren = children;
        this.onLoad()
    }

    onLoad() {
        if (!this.props.events) this.props.events = {};
        if (!this.props.events.load) this.props.events.load = () => {
        };
        this.props.events.load();
        return this;
    }

    render(): HTMLElement {
        const el = document.createElement(this.tagName);
        // set id and className if provided
        if (this.props.id) el.id = this.props.id
        else this.props.id = `dockit-${globalCounter++}`; // Assign a unique id if not provided
        if (this.props.className) el.className = this.props.className;

        // Set attributes and properties

        for (const [key, value] of Object.entries(this.props)) {
            if (reservedPropKeys.has(key)) continue; // Skip reserved keys
            if (key in el) {
                // @ts-ignore
                el[key] = value;
            } else {
                el.setAttribute(key, value);
            }
        }

        // Handle styles
        if (this.props.style) {
            const className = registerOrGetClassName(this.props.style, this.props.id);
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
            } else {
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
                if (reservedPropKeys.has(key)) continue; // Skip reserved keys
                if (key in this._el) {
                    // @ts-ignore
                    this._el[key] = value;
                } else {
                    this._el.setAttribute(key, value);
                }
            }

            // Handle styles
            if (this.props.style) {
                const className = registerOrGetClassName(this.props.style, this.props.id);
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

            this.lastProps = {...this.props}; // Update lastProps
        }

        // Update children if they have changed
        if (JSON.stringify(this.children) !== JSON.stringify(this.lastChildren)) {
            this._el.innerHTML = ''; // Clear existing children
            for (const child of this.children) {
                if (typeof child === 'string') {
                    this._el.appendChild(document.createTextNode(child));
                } else {
                    this._el.appendChild(child.render());
                }
            }
            this.lastChildren = [...this.children]; // Update lastChildren
        }
    }
}

// Content Sectioning
export const address = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "address");
export const article = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "article");
export const aside = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "aside");
export const footer = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "footer");
export const header = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "header");
export const h1 = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "h1");
export const h2 = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "h2");
export const h3 = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "h3");
export const h4 = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "h4");
export const h5 = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "h5");
export const h6 = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "h6");
export const hgroup = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "hgroup");
export const main = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "main");
export const nav = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "nav");
export const section = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "section");
export const search = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "search");

// Text content
export const blockquote = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "blockquote");
export const dd = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "dd");
export const div = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "div");
export const dl = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "dl");
export const dt = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "dt");
export const figcaption = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "figcaption");
export const figure = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "figure");
export const hr = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "hr");
export const li = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "li");
export const menu = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "menu");
export const ol = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "ol");
export const p = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "p");
export const pre = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "pre");
export const ul = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "ul");

// Inline text semantics
export const a = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "a");
export const abbr = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "abbr");
export const b = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "b");
export const bdi = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "bdi");
export const bdo = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "bdo");
export const br = (props: DockitProps = {}) => new Element([], props, "br");
export const cite = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "cite");
export const code = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "code");
export const data = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "data");
export const dfn = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "dfn");
export const em = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "em");
export const i = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "i");
export const kbd = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "kbd");
export const mark = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "mark");
export const q = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "q");
export const rp = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "rp");
export const rt = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "rt");
export const rtc = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "rtc");
export const ruby = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "ruby");
export const s = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "s");
export const samp = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "samp");
export const small = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "small");
export const span = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "span");
export const strong = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "strong");
export const sub = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "sub");
export const sup = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "sup");
export const time = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "time");
export const u = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "u");
export const varr = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "var");
export const wbr = (props: DockitProps = {}) => new Element([], props, "wbr");

// Image and multimedia
export const area = (props: DockitProps = {}) => new Element([], props, "area");
export const audio = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "audio");
export const img = (props: DockitProps = {}) => new Element([], props, "img");
export const map = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "map");
export const track = (props: DockitProps = {}) => new Element([], props, "track");
export const video = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "video");

// Embedded content
export const embed = (props: DockitProps = {}) => new Element([], props, "embed");
export const iframe = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "iframe");
export const fencedframe = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "fencedframe");
export const objectEl = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "object");
export const param = (props: DockitProps = {}) => new Element([], props, "param");
export const picture = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "picture");
export const source = (props: DockitProps = {}) => new Element([], props, "source");

// Svg and MathML
export const svg = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "svg");
export const math = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "math");

// Scripting
export const canvas = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "canvas");
export const noscript = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "noscript");
export const script = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "script");

// Demarcating edits
export const del = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "del");
export const ins = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "ins");

// Table content
export const caption = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "caption");
export const col = (props: DockitProps = {}) => new Element([], props, "col");
export const colgroup = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "colgroup");
export const table = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "table");
export const tbody = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "tbody");
export const td = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "td");
export const tfoot = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "tfoot");
export const th = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "th");
export const thead = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "thead");
export const tr = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "tr");

// Forms
export const button = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "button");
export const datalist = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "datalist");
export const fieldset = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "fieldset");
export const form = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "form");
export const input = (props: DockitProps = {}) => new Element([], props, "input");
export const label = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "label");
export const legend = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "legend");
export const meter = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "meter");
export const optgroup = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "optgroup");
export const option = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "option");
export const output = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "output");
export const progress = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "progress");
export const select = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "select");
export const selectedcontent = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "selectedcontent");
export const textarea = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "textarea");

// Interactive elements
export const details = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "details");
export const dialog = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "dialog");
export const summary = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "summary");

// Web Components *Note If you use these... you're already using a component system. Why?*
export const slot = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "slot");
export const template = (children: Array<Element | string> = [], props: DockitProps = {}) => new Element(children, props, "template");


let count = 0;

const LandingPage = () =>
    div(
        [
            // Hero Section with fadeIn animation
            section(
                [
                    h1(["Welcome to Dockit!"]),
                    p(["Build components with ease 🚀"]),
                    button(["Get Started"], {
                        events: {
                            click: () => alert("You clicked Get Started!"),
                        },
                    }),
                ],
                {
                    style: {
                        default: {
                            textAlign: "center",
                            padding: "4rem 1rem",
                            background: "#e9f5ff",
                        },
                        animation: {
                            keyframes: {
                                fadeIn: {
                                    "0%": {opacity: "0"},
                                    "100%": {opacity: "1"},
                                },
                            },
                            options: {
                                name: "fadeIn",
                                duration: 1000,
                                easing: "ease-out",
                                fillMode: "forwards",
                            },
                        },
                    },
                }
            ),

            // Features Section with slideUp animation
            section(
                [
                    h1(["✨ Features"]),
                    p(["Scoped styles, pseudo selectors, and media queries out-of-the-box!"]),
                    div(
                        [
                            div([p(["⚡ Fast Rendering"]), p(["Updates only when needed."])]),
                            div([p(["🎨 Scoped Styles"]), p(["No global CSS collisions."])]),
                            div([p(["📱 Responsive"]), p(["Media queries supported."])]),
                        ],
                        {
                            style: {
                                default: {
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: "1.5rem",
                                    padding: "0 2rem",
                                },
                            },
                        }
                    ),
                ],
                {
                    style: {
                        default: {
                            padding: "3rem 0",
                            background: "#fff",
                        },
                        animation: {
                            keyframes: {
                                slideUp: {
                                    "0%": {transform: "translateY(30px)", opacity: "0"},
                                    "100%": {transform: "translateY(0)", opacity: "1"},
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
                }
            ),

            // Interactive Counter Section
            section(
                [
                    h1(["🔥 Interactive Demo"]),
                    p(["Click the button to increase the counter:"]),
                    button(
                        [span([`Count: ${count}`])],
                        {
                            id: "counter-btn",
                            events: {
                                click: () => {
                                    count++;
                                    root.replace(LandingPage()); // re-render with updated count
                                },
                            },
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
                                    ":hover": {background: "#1e7e34"},
                                },
                            },
                        }
                    ),
                ],
                {
                    style: {
                        default: {
                            textAlign: "center",
                            padding: "3rem 1rem",
                            background: "#f8f9fa",
                        },
                    },
                }
            ),
        ],
        {
            style: {
                default: {
                    fontFamily: "sans-serif",
                    lineHeight: "1.6",
                    color: "#333",
                },
            },
        }
    );

// --- Mount to page ---
const container = document.getElementById("app")!;
const root = new DockitElementRoot(container, LandingPage());
root.render();