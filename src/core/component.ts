import type { ComponentState, DockitProps } from './types';
import { Element } from './element';

export abstract class Component<S extends ComponentState = {}> extends Element {
    state: S;

    private _childCache: Map<any, Element | string> = new Map();

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

        const newChildren = this.children;

        // Reconcile children with caching to avoid unnecessary re-creation of dom elements
        const reconciledChildren: Array<Element | string> = [];
        const usedKeys = new Set<any>();

        const getKey = (child: Element | string, idx: number) => {
            if (typeof child === 'object') {
                return (child as any).props?.key ?? child; // object identity fallback
            } else {
                // string fallback: use content + index to avoid duplicate strings overwriting
                return `${child}_${idx}`;
            }
        };

        newChildren.forEach((child, idx) => {
            const key = getKey(child, idx);

            if (this._childCache.has(key)) {
                // Reuse cached child
                const cached = this._childCache.get(key)!;
                if (typeof child !== 'string' && cached instanceof Element){
                    (cached as unknown as Element).update();
                    reconciledChildren.push(cached);
                } else {
                    reconciledChildren.push(cached);
                }
            } else {
                // New child, add to cache
                reconciledChildren.push(child);
            }

            usedKeys.add(key);
        })

        // Remove stale children from cache
        Array.from(this._childCache.keys()).forEach(k => {
            if (!usedKeys.has(k)) this._childCache.delete(k);
        });

        // Update cache with reconciled children
        reconciledChildren.forEach((child, idx) => {
            const key = getKey(child, idx);
            this._childCache.set(key, child);
        });

        this.children = reconciledChildren;

    }
}
