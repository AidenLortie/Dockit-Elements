import type { ComponentState, DockitProps } from './types';
import { Element } from './element';

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
