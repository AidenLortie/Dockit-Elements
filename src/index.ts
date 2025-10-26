// Simple string hash (djb2)
function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36); // convert to base36 for shorter hash
}

const StyleRegistry = new Map<string, string>(); // Maps styleHash -> className
const injectedClassNames = new Set<string>(); // Track injected class names
const pendingStyles = new Map<string, DockitStyle>(); // Queue styles for batch injection
let globalCounter = 0; // Global counter for unique identifiers

// WeakMap to store internal element metadata
type ElementMeta = {
    lastProps?: DockitProps;
    lastChildren?: Array<Element | string>;
    eventHandlersMap: Map<string, EventListener>;
    generatedId?: string;
};
const elementMetadata = new WeakMap<Element, ElementMeta>();

const toKebabCase = (str: string) =>
    str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

// Normalize style keys → kebab-case and sort them for stable hashing
const convertStyleKeys = (obj: { [key: string]: any }): { [key: string]: any } => {
    const newObj: { [key: string]: any } = {};
    const sortedKeys = Object.keys(obj).sort();
    for (const key of sortedKeys) {
        newObj[toKebabCase(key)] = obj[key];
    }
    return newObj;
};

// Normalize the entire style object immutably with sorted keys
const normalizeStyle = (style: DockitStyle): DockitStyle => {
    const normalized: DockitStyle = {
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

const registerOrGetClassName = (style: DockitStyle): string => {
    // Normalize style immutably with sorted keys for stable hashing
    const normalizedStyle = normalizeStyle(style);

    // Stable hash based on sorted content
    const styleString = JSON.stringify(normalizedStyle);
    const styleHash = hashString(styleString);

    // Always use a unique class name based on style hash
    const className = `dockit-${styleHash}`;

    if (!StyleRegistry.has(className)) {
        StyleRegistry.set(className, styleString);
        // Queue the style for batch injection
        pendingStyles.set(className, normalizedStyle);
    }

    return className;
};

const reservedPropKeys = new Set(['id', 'className', 'style', 'events']);

// Targeted prop comparison instead of JSON.stringify
const propsChanged = (newProps: DockitProps, oldProps?: DockitProps, el?: Element): boolean => {
    if (!oldProps) return true;

    // Check id and className
    if (newProps.id !== oldProps.id) return true;
    if (newProps.className !== oldProps.className) return true;

    // Check style (deep compare)
    const newStyleStr = newProps.style ? JSON.stringify(normalizeStyle(newProps.style)) : undefined;
    const oldStyleStr = oldProps.style ? JSON.stringify(normalizeStyle(oldProps.style)) : undefined;
    if (newStyleStr !== oldStyleStr) return true;

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

    if (newKeys.length !== oldKeys.length) return true;
    if (newKeys.some((k, i) => k !== oldKeys[i])) return true;

    for (const key of newKeys) {
        if (newProps[key] !== oldProps[key]) return true;
    }

    return false;
};


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
        this.root = undefined as any;
        this.container = undefined as any;
    }

    replace(newRoot: Element) {
        this.lastRoot = this.root;
        this.root = newRoot;
        this.render();
    }

    static injectStyles() {
        const dockitStyleElementId = 'dockit-styles';
        let styleElement = document.getElementById(dockitStyleElementId) as HTMLStyleElement;

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = dockitStyleElementId;
            document.head.appendChild(styleElement);
        }

        // Helper to safely insert a rule
        const safeInsertRule = (rule: string) => {
            try {
                styleElement.sheet?.insertRule(rule, styleElement.sheet.cssRules.length);
            } catch (e) {
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
                const {keyframes, options} = styleObj.animation;

                // Insert keyframes with namespaced names
                for (const [keyframeName, keyframeStyles] of Object.entries(keyframes)) {
                    const namespacedName = `dockit-${className.replace('dockit-', '')}-${keyframeName}`;
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
                        ? options.name.map(n => `dockit-${className.replace('dockit-', '')}-${n}`).join(", ")
                        : `dockit-${className.replace('dockit-', '')}-${options.name}`)
                    : Object.keys(keyframes).map(n => `dockit-${className.replace('dockit-', '')}-${n}`).join(", ");

                let animationRule = `.${className} { animation-name: ${names};`;
                if (options.duration) animationRule += ` animation-duration: ${options.duration}ms;`;
                if (options.easing) animationRule += ` animation-timing-function: ${options.easing};`;
                if (options.delay) animationRule += ` animation-delay: ${options.delay}ms;`;
                if (options.iterations) animationRule += ` animation-iteration-count: ${options.iterations};`;
                if (options.direction) animationRule += ` animation-direction: ${options.direction};`;
                if (options.fillMode) animationRule += ` animation-fill-mode: ${options.fillMode};`;
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

    _el?: Text | HTMLElement; // cached rendered element

    constructor(children: Array<Element | string> = [], props: DockitProps = {}, tagName: string) {
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
        if (!this.props.events) this.props.events = {};
        if (!this.props.events.load) this.props.events.load = () => {
        };
        this.props.events.load();
        return this;
    }

    render(): HTMLElement {
        const el = document.createElement(this.tagName);
        const meta = elementMetadata.get(this)!;
        
        // set id and className if provided
        if (this.props.id) {
            el.id = this.props.id;
            meta.generatedId = this.props.id;
        } else {
            const generatedId = `dockit-${globalCounter++}`;
            meta.generatedId = generatedId;
            this.props.id = generatedId;
        }
        
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
            const className = registerOrGetClassName(this.props.style);
            el.classList.add(className);
        }

        // Handle events with wrapped handlers
        if (this.props.events) {
            for (const [event, handler] of Object.entries(this.props.events)) {
                // Create a wrapper function that we can later remove
                const wrapper = (e: Event) => handler(e);
                meta.eventHandlersMap.set(event, wrapper);
                el.addEventListener(event, wrapper);
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
        
        // Store lastProps and lastChildren in metadata
        meta.lastProps = {...this.props};
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
        const meta = elementMetadata.get(this)!;
        
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
                // Remove any old Dockit-generated classes
                const toRemove: string[] = [];
                el.classList.forEach(cls => {
                    if (cls.startsWith('dockit-')) toRemove.push(cls);
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
                const wrapper = (e: Event) => handler(e);
                meta.eventHandlersMap.set(event, wrapper);
                el.addEventListener(event, wrapper);
            }
            
            meta.lastProps = {...this.props}; // Update lastProps in metadata
            DockitElementRoot.injectStyles();
        }
        
        // --- Improved children diffing ---
        const parent = el;
        const oldChildren = meta.lastChildren || [];
        const newChildren = this.children;
        
        // Build a map of old keyed children for O(1) lookups
        const getKey = (child: any, idx: number) => 
            (typeof child === 'object' && child?.props?.key != null) ? child.props.key : idx;
        
        const oldKeyedMap = new Map<any, { child: Element | string, index: number }>();
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
                if (typeof newChild !== 'string' && newChild) newChild.update();
                domIdx++;
                continue;
            }
            
            if (oldMatch) {
                const oldChild = oldMatch.child;
                if (typeof newChild === 'string' && typeof oldChild === 'string') {
                    if (newChild !== oldChild) {
                        // Mutate text node instead of replacing
                        const textNode = parent.childNodes[domIdx] as Text;
                        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                            textNode.textContent = newChild;
                        } else {
                            parent.replaceChild(document.createTextNode(newChild), parent.childNodes[domIdx]);
                        }
                    }
                } else if (typeof newChild !== 'string' && typeof oldChild !== 'string') {
                    if (newChild === oldChild) {
                        newChild._el = oldChild._el;
                        newChild.update();
                    } else {
                        // Key matches but instance is different: replace node and call render on new instance
                        const node = newChild.render();
                        parent.replaceChild(node, parent.childNodes[domIdx]);
                        newChild._el = node;
                        DockitElementRoot.injectStyles(); // Ensure styles for new child
                    }
                } else {
                    const node = (typeof newChild === 'string') ? document.createTextNode(newChild) : newChild.render();
                    parent.replaceChild(node, parent.childNodes[domIdx]);
                    if (typeof newChild !== 'string' && node instanceof HTMLElement) newChild._el = node;
                    DockitElementRoot.injectStyles(); // Ensure styles for new child
                }
                domIdx++;
            } else {
                // New child, insert
                const node = (typeof newChild === 'string') ? document.createTextNode(newChild) : newChild.render();
                if (parent.childNodes[domIdx]) {
                    parent.insertBefore(node, parent.childNodes[domIdx]);
                } else {
                    parent.appendChild(node);
                }
                if (typeof newChild !== 'string' && node instanceof HTMLElement) newChild._el = node;
                DockitElementRoot.injectStyles(); // Ensure styles for inserted child
                domIdx++;
            }
        }
        
        // Remove any extra old children
        while (parent.childNodes.length > newChildren.length) {
            parent.removeChild(parent.lastChild!);
        }
        
        meta.lastChildren = [...this.children]; // Store references in metadata
        DockitElementRoot.injectStyles(); // Final catch-all to ensure all styles are injected
    }
}

// --- Component Base Class for Interactive Components ---
interface ComponentState {
    [key: string]: any;
}

export abstract class Component<S extends ComponentState = {}> extends Element {
    state: S;

    constructor(initialState: S, tagName: string = "div", props: DockitProps = {}) {
        super([], props, tagName);
        this.state = initialState;
        // Do not call this.updateView() here; subclasses must call it after their own fields are initialized.
    }

    setState(partial: Partial<S>) {
        this.state = {...this.state, ...partial};
        this.updateView();
        this.update();
    }

    // Subclasses must implement this to set this.children
    abstract renderView(): void;

    updateView() {
        this.renderView();
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
