export type DockitStyle = {
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

export type DockitProps = {
    id?: string;
    className?: string;
    style?: DockitStyle,
    events?: {
        [key: string]: (e?: Event) => void;
    },
    [key: string]: any; //for other attributes like href, src, alt, etc.
}

export interface ComponentState {
    [key: string]: any;
}

export type ElementMeta = {
    lastProps?: DockitProps;
    lastChildren?: Array<any>;
    eventHandlersMap: Map<string, EventListener>;
    generatedId?: string;
};
