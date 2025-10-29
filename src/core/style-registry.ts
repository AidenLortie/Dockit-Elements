import type { DockitStyle } from './types';
import { CLASS_PREFIX } from './constants';

// Simple string hash (djb2)
function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36); // convert to base36 for shorter hash
}

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
export const normalizeStyle = (style: DockitStyle): DockitStyle => {
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

const StyleRegistry = new Map<string, string>(); // Maps styleHash -> className
const injectedClassNames = new Set<string>(); // Track injected class names
const pendingStyles = new Map<string, DockitStyle>(); // Queue styles for batch injection

export const registerOrGetClassName = (style: DockitStyle): string => {
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

export const injectStyles = () => {
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
};
