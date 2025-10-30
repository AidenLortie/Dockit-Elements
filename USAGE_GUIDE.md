# Building on the Dockit Elements Refactor

## Overview
With the modular architecture now in place, Dockit Elements is structured for scalable growth. This guide explains how to **extend**, **improve**, and **maintain** the framework going forward.

## Adding New Modules
If adding new functionality:
1. Create a new file under `src/core/`
2. Export your new utilities, functions, or classes.
3. Add any new types to `src/core/types.ts`.
4. Re-export in `src/index.ts` to make it public.

**Example:**
```ts
// src/core/animation.ts
export function animateElement(el: Element, props: any) { ... }

// src/index.ts
export * from './core/animation';
```

## Creating New HTML Elements
1. Add new factory functions in `src/elements.ts`
2. Follow the pattern of existing elements (e.g., `div`, `span`, `button`)
3. Ensure proper prop forwarding and event handling.

**Example:**
```ts
export const nav = (props?: DockitProps, ...children: any[]) =>
  createElement('nav', props, ...children);
```

## Expanding the Style System
Modify `src/core/style-registry.ts` to introduce:
- Scoped animations
- Global style caching
- Pseudo-class or media query handling

Keep these isolated so style logic remains independent from element logic.

## Testing
Each new module should include dedicated unit tests. Example categories:
- **Utilities:** Input/output correctness.
- **Components:** Rendering & reactivity.
- **Styles:** Class name generation consistency.

Use mock DOMs where applicable for testing render outputs.

## Documentation
Every new module should include:
- Inline JSDoc for all functions/classes
- Section updates in `ARCHITECTURE.md` (for new core modules)

## Future Improvements
- **Plugin System:** Hook into lifecycle or render phases?
- **SSR Support:** Add rendering layer for Node environments?
---
**Last Updated:** 2025-10-29
