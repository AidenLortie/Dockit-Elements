import type { DockitProps } from './types';
import { CLASS_PREFIX } from './constants';
import { 
    getNextId, 
    elementMetadata, 
    reservedPropKeys, 
    propsChanged 
} from './element-utils';
import { registerOrGetClassName, injectStyles } from './style-registry';

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
            const generatedId = getNextId();
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

        injectStyles(); // Ensure styles for any new classes are injected after render
        return el;
    }

    update() {
        if (!this._el) {
            this.render();
            injectStyles(); // Ensure styles after initial render
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
                    if (cls.startsWith(CLASS_PREFIX)) toRemove.push(cls);
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
            injectStyles();
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
                        const node = parent.childNodes[domIdx];
                        if (node && node.nodeType === Node.TEXT_NODE) {
                            node.textContent = newChild;
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
                        injectStyles(); // Ensure styles for new child
                    }
                } else {
                    const node = (typeof newChild === 'string') ? document.createTextNode(newChild) : newChild.render();
                    parent.replaceChild(node, parent.childNodes[domIdx]);
                    if (typeof newChild !== 'string' && node instanceof HTMLElement) newChild._el = node;
                    injectStyles(); // Ensure styles for new child
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
                injectStyles(); // Ensure styles for inserted child
                domIdx++;
            }
        }
        
        // Remove any extra old children
        while (parent.childNodes.length > newChildren.length) {
            parent.removeChild(parent.lastChild!);
        }
        
        meta.lastChildren = [...this.children]; // Store references in metadata
        injectStyles(); // Final catch-all to ensure all styles are injected
    }
}
