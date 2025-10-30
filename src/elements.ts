import type { DockitProps } from './core/types';
import { Element } from './core/element';

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
