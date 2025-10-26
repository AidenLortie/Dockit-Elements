// Simple string hash (djb2)
function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36); // convert to base36 for shorter hash
}
const StyleRegistry = new Map(); // Maps styleHash -> className
const injectedClassNames = new Set(); // Track injected class names
const pendingStyles = new Map(); // Queue styles for batch injection
let globalCounter = 0; // Global counter for unique identifiers
const CLASS_PREFIX = 'dockit-'; // Constant for class name prefix
const elementMetadata = new WeakMap();
const toKebabCase = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
// Normalize style keys → kebab-case and sort them for stable hashing
const convertStyleKeys = (obj) => {
    const newObj = {};
    const sortedKeys = Object.keys(obj).sort();
    for (const key of sortedKeys) {
        newObj[toKebabCase(key)] = obj[key];
    }
    return newObj;
};
// Normalize the entire style object immutably with sorted keys
const normalizeStyle = (style) => {
    const normalized = {
        default: convertStyleKeys(style.default)
    };
    if (style.pseudo) {
        normalized.pseudo = {};
        const sortedPseudoKeys = Object.keys(style.pseudo).sort();
        for (const pseudo of sortedPseudoKeys) {
            normalized.pseudo[pseudo] = convertStyleKeys(style.pseudo[pseudo]);
        }
    }
    if (style.media) {
        normalized.media = {};
        const sortedMediaKeys = Object.keys(style.media).sort();
        for (const media of sortedMediaKeys) {
            normalized.media[media] = convertStyleKeys(style.media[media]);
        }
    }
    if (style.animation) {
        normalized.animation = {
            keyframes: {},
            options: style.animation.options
        };
        const sortedKeyframeNames = Object.keys(style.animation.keyframes).sort();
        for (const keyframeName of sortedKeyframeNames) {
            normalized.animation.keyframes[keyframeName] = {};
            const keyframe = style.animation.keyframes[keyframeName];
            const sortedPercents = Object.keys(keyframe).sort();
            for (const percent of sortedPercents) {
                normalized.animation.keyframes[keyframeName][percent] = convertStyleKeys(keyframe[percent]);
            }
        }
    }
    return normalized;
};
const registerOrGetClassName = (style) => {
    // Normalize style immutably with sorted keys for stable hashing
    const normalizedStyle = normalizeStyle(style);
    // Stable hash based on sorted content
    const styleString = JSON.stringify(normalizedStyle);
    const styleHash = hashString(styleString);
    // Always use a unique class name based on style hash
    const className = `${CLASS_PREFIX}${styleHash}`;
    if (!StyleRegistry.has(className)) {
        StyleRegistry.set(className, styleString);
        // Queue the style for batch injection
        pendingStyles.set(className, normalizedStyle);
    }
    return className;
};
const reservedPropKeys = new Set(['id', 'className', 'style', 'events']);
// Targeted prop comparison instead of JSON.stringify
const propsChanged = (newProps, oldProps, el) => {
    if (!oldProps)
        return true;
    // Check id and className
    if (newProps.id !== oldProps.id)
        return true;
    if (newProps.className !== oldProps.className)
        return true;
    // Check style (deep compare)
    const newStyleStr = newProps.style ? JSON.stringify(normalizeStyle(newProps.style)) : undefined;
    const oldStyleStr = oldProps.style ? JSON.stringify(normalizeStyle(oldProps.style)) : undefined;
    if (newStyleStr !== oldStyleStr)
        return true;
    // Check events (compare function identity using metadata)
    if (el) {
        const meta = elementMetadata.get(el);
        if (meta) {
            const newEvents = newProps.events || {};
            const oldEvents = oldProps.events || {};
            const allEventKeys = new Set([...Object.keys(newEvents), ...Object.keys(oldEvents)]);
            for (const eventKey of allEventKeys) {
                if (newEvents[eventKey] !== oldEvents[eventKey]) {
                    return true;
                }
            }
        }
    }
    // Check other attribute keys and values
    const newKeys = Object.keys(newProps).filter(k => !reservedPropKeys.has(k)).sort();
    const oldKeys = Object.keys(oldProps).filter(k => !reservedPropKeys.has(k)).sort();
    if (newKeys.length !== oldKeys.length)
        return true;
    if (newKeys.some((k, i) => k !== oldKeys[i]))
        return true;
    for (const key of newKeys) {
        if (newProps[key] !== oldProps[key])
            return true;
    }
    return false;
};
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
        DockitElementRoot.injectStyles(); // Inject styles after registration, before DOM attach
        this.container.appendChild(dom);
    }
    update() {
        if (!this.lastRoot || JSON.stringify(this.root) !== JSON.stringify(this.lastRoot)) {
            this.root.update();
            DockitElementRoot.injectStyles(); // Ensure new styles are injected after updates
        }
    }
    destroy() {
        this.container.innerHTML = '';
        this.lastRoot = undefined;
        this.root = undefined;
        this.container = undefined;
    }
    replace(newRoot) {
        this.lastRoot = this.root;
        this.root = newRoot;
        this.render();
    }
    static injectStyles() {
        const dockitStyleElementId = 'dockit-styles';
        let styleElement = document.getElementById(dockitStyleElementId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = dockitStyleElementId;
            document.head.appendChild(styleElement);
        }
        // Helper to safely insert a rule
        const safeInsertRule = (rule) => {
            try {
                styleElement.sheet?.insertRule(rule, styleElement.sheet.cssRules.length);
            }
            catch (e) {
                // Fallback for browsers that reject insertRule
                styleElement.appendChild(document.createTextNode(rule));
            }
        };
        // Only process pending styles that haven't been injected yet
        pendingStyles.forEach((styleObj, className) => {
            if (injectedClassNames.has(className)) {
                return; // Already injected
            }
            // Default styles
            let rule = `.${className} {`;
            for (const [key, value] of Object.entries(styleObj.default)) {
                rule += `${key}: ${value};`;
            }
            rule += `}`;
            safeInsertRule(rule);
            // Pseudo selectors
            if (styleObj.pseudo) {
                for (const [pseudo, pseudoStyles] of Object.entries(styleObj.pseudo)) {
                    let pseudoRule = `.${className}${pseudo} {`;
                    for (const [key, value] of Object.entries(pseudoStyles)) {
                        pseudoRule += `${key}: ${value};`;
                    }
                    pseudoRule += `}`;
                    safeInsertRule(pseudoRule);
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
                    safeInsertRule(mediaRule);
                }
            }
            // Animations with namespacing
            if (styleObj.animation) {
                const { keyframes, options } = styleObj.animation;
                // Extract hash from className (remove prefix)
                const classHash = className.startsWith(CLASS_PREFIX) ? className.substring(CLASS_PREFIX.length) : className;
                // Insert keyframes with namespaced names
                for (const [keyframeName, keyframeStyles] of Object.entries(keyframes)) {
                    const namespacedName = `${CLASS_PREFIX}${classHash}-${keyframeName}`;
                    let keyframeRule = `@keyframes ${namespacedName} {`;
                    for (const [percent, styles] of Object.entries(keyframeStyles)) {
                        keyframeRule += `${percent} {`;
                        for (const [key, value] of Object.entries(styles)) {
                            keyframeRule += `${key}: ${value};`;
                        }
                        keyframeRule += `}`;
                    }
                    keyframeRule += `}`;
                    safeInsertRule(keyframeRule);
                }
                // Animation options with namespaced keyframe names
                const names = options.name
                    ? (Array.isArray(options.name)
                        ? options.name.map(n => `${CLASS_PREFIX}${classHash}-${n}`).join(", ")
                        : `${CLASS_PREFIX}${classHash}-${options.name}`)
                    : Object.keys(keyframes).map(n => `${CLASS_PREFIX}${classHash}-${n}`).join(", ");
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
                safeInsertRule(animationRule);
            }
            // Mark as injected
            injectedClassNames.add(className);
        });
        // Clear pending styles after injection
        pendingStyles.clear();
    }
}
export class Element {
    tagName;
    props;
    children;
    _el; // cached rendered element
    constructor(children = [], props = {}, tagName) {
        this.tagName = tagName;
        this.props = props;
        this.children = children;
        // Initialize metadata in WeakMap
        elementMetadata.set(this, {
            eventHandlersMap: new Map(),
        });
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
        const meta = elementMetadata.get(this);
        // set id and className if provided
        if (this.props.id) {
            el.id = this.props.id;
            meta.generatedId = this.props.id;
        }
        else {
            const generatedId = `${CLASS_PREFIX}${globalCounter++}`;
            meta.generatedId = generatedId;
            this.props.id = generatedId;
        }
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
        // Handle events with wrapped handlers
        if (this.props.events) {
            for (const [event, handler] of Object.entries(this.props.events)) {
                // Create a wrapper function that we can later remove
                const wrapper = (e) => handler(e);
                meta.eventHandlersMap.set(event, wrapper);
                el.addEventListener(event, wrapper);
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
        // Store lastProps and lastChildren in metadata
        meta.lastProps = { ...this.props };
        meta.lastChildren = [...this.children];
        DockitElementRoot.injectStyles(); // Ensure styles for any new classes are injected after render
        return el;
    }
    update() {
        if (!this._el) {
            this.render();
            DockitElementRoot.injectStyles(); // Ensure styles after initial render
            return;
        }
        // Type guard: only proceed if _el is HTMLElement
        if (!(this._el instanceof HTMLElement)) {
            return;
        }
        const el = this._el; // TypeScript: el is HTMLElement
        let meta = elementMetadata.get(this);
        // Ensure metadata exists (defensive programming)
        if (!meta) {
            meta = {
                eventHandlersMap: new Map(),
            };
            elementMetadata.set(this, meta);
        }
        // Update props if they have changed using targeted comparison
        if (propsChanged(this.props, meta.lastProps, this)) {
            // Update id and className if changed
            if (this.props.id && this.props.id !== meta.lastProps?.id) {
                el.id = this.props.id;
            }
            if (this.props.className && this.props.className !== meta.lastProps?.className) {
                el.className = this.props.className;
            }
            // Update attributes and properties
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
                // Remove any old Dockit-generated classes
                const toRemove = [];
                el.classList.forEach(cls => {
                    if (cls.startsWith(CLASS_PREFIX))
                        toRemove.push(cls);
                });
                toRemove.forEach(cls => el.classList.remove(cls));
                // Add the new class
                const className = registerOrGetClassName(this.props.style);
                el.classList.add(className);
            }
            // Handle events with proper removal using stored wrappers
            const oldEvents = meta.lastProps?.events || {};
            const newEvents = this.props.events || {};
            // Remove old event listeners
            for (const [event, _handler] of Object.entries(oldEvents)) {
                const wrapper = meta.eventHandlersMap.get(event);
                if (wrapper) {
                    el.removeEventListener(event, wrapper);
                    meta.eventHandlersMap.delete(event);
                }
            }
            // Add new event listeners with wrappers
            for (const [event, handler] of Object.entries(newEvents)) {
                const wrapper = (e) => handler(e);
                meta.eventHandlersMap.set(event, wrapper);
                el.addEventListener(event, wrapper);
            }
            meta.lastProps = { ...this.props }; // Update lastProps in metadata
            DockitElementRoot.injectStyles();
        }
        // --- Improved children diffing ---
        const parent = el;
        const oldChildren = meta.lastChildren || [];
        const newChildren = this.children;
        // Build a map of old keyed children for O(1) lookups
        const getKey = (child, idx) => (typeof child === 'object' && child?.props?.key != null) ? child.props.key : idx;
        const oldKeyedMap = new Map();
        for (let i = 0; i < oldChildren.length; i++) {
            const key = getKey(oldChildren[i], i);
            oldKeyedMap.set(key, { child: oldChildren[i], index: i });
        }
        let domIdx = 0;
        for (let i = 0; i < newChildren.length; i++) {
            const newChild = newChildren[i];
            const key = getKey(newChild, i);
            const oldMatch = oldKeyedMap.get(key);
            // Reference equality: if same instance, always update in place
            if (oldMatch && newChild === oldMatch.child) {
                if (typeof newChild !== 'string' && newChild)
                    newChild.update();
                domIdx++;
                continue;
            }
            if (oldMatch) {
                const oldChild = oldMatch.child;
                if (typeof newChild === 'string' && typeof oldChild === 'string') {
                    if (newChild !== oldChild) {
                        // Mutate text node instead of replacing
                        const node = parent.childNodes[domIdx];
                        if (node && node.nodeType === Node.TEXT_NODE) {
                            node.textContent = newChild;
                        }
                        else {
                            parent.replaceChild(document.createTextNode(newChild), parent.childNodes[domIdx]);
                        }
                    }
                }
                else if (typeof newChild !== 'string' && typeof oldChild !== 'string') {
                    if (newChild === oldChild) {
                        newChild._el = oldChild._el;
                        newChild.update();
                    }
                    else {
                        // Key matches but instance is different: replace node and call render on new instance
                        const node = newChild.render();
                        parent.replaceChild(node, parent.childNodes[domIdx]);
                        newChild._el = node;
                        DockitElementRoot.injectStyles(); // Ensure styles for new child
                    }
                }
                else {
                    const node = (typeof newChild === 'string') ? document.createTextNode(newChild) : newChild.render();
                    parent.replaceChild(node, parent.childNodes[domIdx]);
                    if (typeof newChild !== 'string' && node instanceof HTMLElement)
                        newChild._el = node;
                    DockitElementRoot.injectStyles(); // Ensure styles for new child
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
                DockitElementRoot.injectStyles(); // Ensure styles for inserted child
                domIdx++;
            }
        }
        // Remove any extra old children
        while (parent.childNodes.length > newChildren.length) {
            parent.removeChild(parent.lastChild);
        }
        meta.lastChildren = [...this.children]; // Store references in metadata
        DockitElementRoot.injectStyles(); // Final catch-all to ensure all styles are injected
    }
}
export class Component extends Element {
    state;
    constructor(initialState, tagName = "div", props = {}) {
        super([], props, tagName);
        this.state = initialState;
        // Do not call this.updateView() here; subclasses must call it after their own fields are initialized.
    }
    setState(partial) {
        this.state = { ...this.state, ...partial };
        this.updateView();
        this.update();
    }
    updateView() {
        this.renderView();
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
//# sourceMappingURL=index.js.map