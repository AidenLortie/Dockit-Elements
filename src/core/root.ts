import type { DockitProps } from './types';
import { injectStyles } from './style-registry';
import { Element } from './element';

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
        injectStyles(); // Inject styles after registration, before DOM attach
        this.container.appendChild(dom);
    }

    update() {
        if (!this.lastRoot || JSON.stringify(this.root) !== JSON.stringify(this.lastRoot)) {
            this.root.update();
            injectStyles(); // Ensure new styles are injected after updates
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

    // Static method for backward compatibility
    static injectStyles() {
        injectStyles();
    }
}
