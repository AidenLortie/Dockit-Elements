export declare class DockitElementRoot {
    container: HTMLElement;
    root: Element;
    lastRoot?: Element;
    constructor(container: HTMLElement, root: Element);
    render(): void;
    update(): void;
    destroy(): void;
    replace(newRoot: Element): void;
    static injectStyles(): void;
}
type DockitStyle = {
    default: {
        [key: string]: string;
    };
    pseudo?: {
        [key: string]: {
            [key: string]: string;
        };
    };
    media?: {
        [key: string]: {
            [key: string]: string;
        };
    };
    animation?: {
        keyframes: {
            [key: string]: {
                [key: string]: {
                    [key: string]: string;
                };
            };
        };
        options: {
            name: string | string[];
            duration?: number;
            easing?: string;
            delay?: number;
            iterations?: number | 'infinite';
            direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
            fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
            playbackRate?: number;
        };
    };
};
type DockitProps = {
    id?: string;
    className?: string;
    style?: DockitStyle;
    events?: {
        [key: string]: (e?: Event) => void;
    };
    [key: string]: any;
};
export declare class Element {
    tagName: string;
    props: DockitProps;
    children: Array<Element | string>;
    _el?: Text | HTMLElement;
    constructor(children: Array<Element | string> | undefined, props: DockitProps | undefined, tagName: string);
    onLoad(): this;
    render(): HTMLElement;
    update(): void;
}
interface ComponentState {
    [key: string]: any;
}
export declare abstract class Component<S extends ComponentState = {}> extends Element {
    state: S;
    constructor(initialState: S, tagName?: string, props?: DockitProps);
    setState(partial: Partial<S>): void;
    abstract renderView(): void;
    updateView(): void;
}
export declare const address: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const article: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const aside: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const footer: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const header: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const h1: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const h2: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const h3: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const h4: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const h5: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const h6: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const hgroup: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const main: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const nav: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const section: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const search: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const blockquote: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const dd: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const div: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const dl: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const dt: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const figcaption: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const figure: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const hr: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const li: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const menu: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const ol: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const p: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const pre: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const ul: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const a: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const abbr: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const b: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const bdi: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const bdo: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const br: (props?: DockitProps) => Element;
export declare const cite: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const code: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const data: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const dfn: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const em: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const i: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const kbd: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const mark: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const q: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const rp: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const rt: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const rtc: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const ruby: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const s: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const samp: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const small: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const span: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const strong: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const sub: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const sup: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const time: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const u: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const varr: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const wbr: (props?: DockitProps) => Element;
export declare const area: (props?: DockitProps) => Element;
export declare const audio: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const img: (props?: DockitProps) => Element;
export declare const map: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const track: (props?: DockitProps) => Element;
export declare const video: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const embed: (props?: DockitProps) => Element;
export declare const iframe: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const fencedframe: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const objectEl: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const param: (props?: DockitProps) => Element;
export declare const picture: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const source: (props?: DockitProps) => Element;
export declare const svg: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const math: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const canvas: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const noscript: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const script: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const del: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const ins: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const caption: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const col: (props?: DockitProps) => Element;
export declare const colgroup: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const table: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const tbody: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const td: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const tfoot: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const th: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const thead: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const tr: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const button: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const datalist: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const fieldset: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const form: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const input: (props?: DockitProps) => Element;
export declare const label: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const legend: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const meter: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const optgroup: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const option: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const output: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const progress: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const select: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const selectedcontent: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const textarea: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const details: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const dialog: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const summary: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const slot: (children?: Array<Element | string>, props?: DockitProps) => Element;
export declare const template: (children?: Array<Element | string>, props?: DockitProps) => Element;
export {};
