import type { DockitProps, ElementMeta } from './types';
import { normalizeStyle } from './style-registry';
import { CLASS_PREFIX } from './constants';

// Global counter for unique identifiers - wrapped in object for mutability across modules
const counterState = { value: 0 };
export const getNextId = () => `${CLASS_PREFIX}${counterState.value++}`;

// WeakMap to store internal element metadata
export const elementMetadata = new WeakMap<any, ElementMeta>();

export const reservedPropKeys = new Set(['id', 'className', 'style', 'events', 'key']);

// Targeted prop comparison instead of JSON.stringify
export const propsChanged = (newProps: DockitProps, oldProps?: DockitProps, el?: any): boolean => {
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
