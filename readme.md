# Dockit Element — In-Depth Tutorial & Reference

Dockit Element is a lightweight, zero-dependency UI library for building reactive, component-based web interfaces in TypeScript or JavaScript. This guide will take you from first steps to advanced usage, with best practices, troubleshooting, and real-world patterns.

---

## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Project Structure & Setup](#project-structure--setup)
4. [Hello World: Your First Dockit App](#hello-world-your-first-dockit-app)
5. [Mounting Components: DockitElementRoot](#mounting-components-dockitelementroot)
6. [Stateless vs Stateful Components](#stateless-vs-stateful-components)
    - [Stateless Components](#stateless-components)
    - [Stateful Components](#stateful-components)
    - [Props and Children](#props-and-children)
7. [Handling Events](#handling-events)
8. [Styling: Scoped, Dynamic, and Responsive](#styling-scoped-dynamic-and-responsive)
9. [Composing and Reusing Components](#composing-and-reusing-components)
10. [State, Reactivity, and the Virtual DOM](#state-reactivity-and-the-virtual-dom)
11. [Animations: Keyframes, Transitions, and State](#animations-keyframes-transitions-and-state)
12. [Advanced Stateful Patterns: Custom Methods & Lifecycle](#advanced-stateful-patterns-custom-methods--lifecycle)
13. [Testing Dockit Components](#testing-dockit-components)
14. [Integrating Dockit as a Library](#integrating-dockit-as-a-library)
15. [Advanced Topics](#advanced-topics)
16. [Troubleshooting & FAQ](#troubleshooting--faq)
17. [Contributing & Extending](#contributing--extending)
18. [License](#license)

---

## Introduction

Dockit Element is designed for developers who want a simple, fast, and flexible way to build UI components without the overhead of large frameworks. It is ideal for:
- Embedding interactive widgets in any web project
- Building small to medium SPAs
- Learning about virtual DOM and component architectures
- Creating libraries of reusable UI components

**Philosophy:** Dockit is minimal, explicit, and easy to understand. It gives you full control over your UI logic and styles, without magic or hidden state.

---

## Installation

### a) With npm (recommended)
```sh
npm install dockit-element
```

### b) Manual Copy
Copy `src/index.ts` into your project and import from there.

---

## Project Structure & Setup

A typical Dockit project might look like:
```
my-app/
  src/
    index.ts         # Your app entry point
    components/      # Your Dockit components
  public/
    index.html       # Your HTML entry
  package.json
  tsconfig.json
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dockit Element App</title>
</head>
<body>
  <div id="app"></div>
  <script src="dist/bundle.js"></script> <!-- or your compiled JS -->
</body>
</html>
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "esnext",
    "strict": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

---

## Hello World: Your First Dockit App

Dockit uses a virtual DOM and a simple API for creating elements. Here’s how to render a message:

```typescript
import { div, DockitElementRoot } from 'dockit-element';

const root = new DockitElementRoot(
  document.getElementById('app')!,
  div(["Hello, Dockit!"])
);
root.render();
```

**Key Points:**
- Always use `DockitElementRoot` to mount your app/component tree. This ensures proper style injection and updates.
- The first argument is the DOM container, the second is your root Dockit element/component.

---

## Mounting Components: DockitElementRoot

`DockitElementRoot` is the entry point for rendering and updating your Dockit UI. It manages the root element, style injection, and updates.

**Example:**
```typescript
import { DockitElementRoot, div } from 'dockit-element';

const appRoot = new DockitElementRoot(
  document.getElementById('app')!,
  div(["Welcome to Dockit!"])
);
appRoot.render();
```

- To update the root, use `appRoot.replace(newRootElement)`.
- To re-render (e.g., after state changes), use `appRoot.update()`.

---

## Stateless vs Stateful Components

### Stateless Components
Stateless components are just functions that return Dockit elements. Use them for simple, reusable UI pieces that don’t manage their own state.

```typescript
import { h1, p, div } from 'dockit-element';

function WelcomeMessage({ name }: { name: string }) {
  return div([
    h1([`Welcome, ${name}!`]),
    p(["This is your first Dockit component."])
  ]);
}

const root = new DockitElementRoot(
  document.getElementById('app')!,
  WelcomeMessage({ name: "Developer" })
);
root.render();
```

### Stateful Components
Stateful components extend the `Component` base class. Use them for interactive UI that manages its own state.

```typescript
import { Component, h1, button, span, DockitElementRoot } from 'dockit-element';

class Counter extends Component<{ count: number }> {
  constructor(initial = 0) {
    super({ count: initial });
    this.updateView();
  }
  renderView() {
    this.children = [
      h1(["Counter"]),
      button([
        span([`Count: ${this.state.count}`])
      ], {
        events: { click: () => this.setState({ count: this.state.count + 1 }) }
      })
    ];
  }
}

const root = new DockitElementRoot(
  document.getElementById('app')!,
  new Counter(0)
);
root.render();
```

### Props and Children
Props are passed as arguments to your component functions or constructors. Children are passed as arrays and can be spread into the element tree.

```typescript
function Card({ title, children }: { title: string, children: any[] }) {
  return div([
    h1([title]),
    ...children
  ], { style: { default: { border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' } } });
}

const card = Card({ title: "My Card", children: [div(["Card content here!"])] });
const root = new DockitElementRoot(document.getElementById('app')!, card);
root.render();
```

---

## Handling Events

Attach event handlers using the `events` prop. You can use any standard DOM event name (e.g., `click`, `input`, `change`).

```typescript
import { button, DockitElementRoot } from 'dockit-element';

const btn = button(["Click me!"], {
  events: { click: () => alert("Button clicked!") }
});

const root = new DockitElementRoot(document.getElementById('app')!, btn);
root.render();
```

**Tip:** For stateful components, use class methods or arrow functions to ensure `this` is correct.

---

## Styling: Scoped, Dynamic, and Responsive

Dockit Element supports scoped styles as objects, including pseudo-selectors, media queries, and even keyframe animations.

```typescript
import { div, DockitElementRoot } from 'dockit-element';

const myStyle = {
  default: { color: 'purple', padding: '1rem', borderRadius: '8px' },
  pseudo: { ':hover': { color: 'orange', background: '#f0f0f0' } },
  media: { '(max-width: 600px)': { fontSize: '0.8rem' } }
};

const styledDiv = div(["Styled text!"], { style: myStyle });
const root = new DockitElementRoot(document.getElementById('app')!, styledDiv);
root.render();
```

**Advanced:** You can also use the `animation` property for keyframes and transitions. See the source for details.

---

## Composing and Reusing Components

Compose your UI from small, reusable components. You can nest stateless and stateful components freely.

```typescript
function Card({ title, content }: { title: string, content: string }) {
  return div([
    h1([title]),
    p([content])
  ], { style: { default: { border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' } } });
}

const cards = div([
  Card({ title: "Card 1", content: "This is the first card." }),
  Card({ title: "Card 2", content: "This is the second card." })
]);
const root = new DockitElementRoot(document.getElementById('app')!, cards);
root.render();
```

---

## State, Reactivity, and the Virtual DOM

Dockit Element uses a virtual DOM and a granular diffing algorithm for efficient updates. When you call `setState` in a `Component`, Dockit:
- Updates the component’s state
- Calls `renderView()` to update the virtual DOM tree
- Diffs the new tree against the old one and updates only what’s changed in the real DOM

**Example:**
```typescript
class Toggle extends Component<{ on: boolean }> {
  constructor() {
    super({ on: false });
    this.updateView();
  }
  renderView() {
    this.children = [
      button([
        this.state.on ? "ON" : "OFF"
      ], {
        events: { click: () => this.setState({ on: !this.state.on }) }
      })
    ];
  }
}
const root = new DockitElementRoot(document.getElementById('app')!, new Toggle());
root.render();
```

**Performance:** Dockit is fast for small/medium apps and widgets. For very large trees, consider batching updates or using keys for list items.

---

## Animations: Keyframes, Transitions, and State

Dockit Element supports advanced CSS animations and transitions directly in the `style` prop. You can define keyframes, trigger animations from state, and combine with pseudo-selectors for interactive effects.

### Defining Keyframes and Animations

```typescript
const animatedStyle = {
  default: {
    width: '200px',
    height: '100px',
    background: '#4e54c8',
    color: '#fff',
    borderRadius: '8px',
    textAlign: 'center',
    lineHeight: '100px',
    animationName: 'fadeIn',
    animationDuration: '1s',
    animationFillMode: 'forwards',
  },
  animation: {
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0', transform: 'scale(0.8)' },
        '100%': { opacity: '1', transform: 'scale(1)' }
      }
    },
    options: {
      name: 'fadeIn',
      duration: 1000,
      fillMode: 'forwards',
      easing: 'ease-out',
    }
  }
};

const animatedDiv = div(["Animated!"], { style: animatedStyle });
```

### Animating on State Change

You can trigger animations by changing the style or class in response to state. For example, a fade-in/fade-out toggle:

```typescript
class FadeToggle extends Component<{ visible: boolean }> {
  constructor() {
    super({ visible: true });
    this.updateView();
  }
  toggle = () => this.setState({ visible: !this.state.visible });
  renderView() {
    this.children = [
      button([this.state.visible ? "Hide" : "Show"], { events: { click: this.toggle } }),
      this.state.visible ? div(["I fade in!"], { style: animatedStyle }) : null
    ];
  }
}
```

**Tip:** You can use different animation names or style objects based on state for more complex effects (e.g., slide, bounce, etc.).

### Combining with Pseudo-Selectors

Dockit lets you combine animations with pseudo-selectors for hover/focus effects:

```typescript
const hoverAnimStyle = {
  default: { transition: 'background 0.3s' },
  pseudo: { ':hover': { background: '#ffb347' } }
};
```

---

## Advanced Stateful Patterns: Custom Methods & Lifecycle

Stateful components can have custom methods for encapsulating logic, updating state, and triggering DOM updates. This is especially useful for complex UI (forms, timers, modals, etc.).

### Custom Methods Example: Timer

```typescript
class Timer extends Component<{ seconds: number, running: boolean }> {
  interval: any;
  constructor() {
    super({ seconds: 0, running: false });
    this.updateView();
  }
  start = () => {
    if (!this.state.running) {
      this.setState({ running: true });
      this.interval = setInterval(() => {
        this.setState({ seconds: this.state.seconds + 1 });
      }, 1000);
    }
  };
  stop = () => {
    if (this.state.running) {
      clearInterval(this.interval);
      this.setState({ running: false });
    }
  };
  reset = () => {
    this.setState({ seconds: 0 });
  };
  // Clean up interval if unmounted (pattern)
  destroy = () => {
    clearInterval(this.interval);
  };
  renderView() {
    this.children = [
      h1([`Timer: ${this.state.seconds}s`]),
      button([this.state.running ? "Stop" : "Start"], { events: { click: this.state.running ? this.stop : this.start } }),
      button(["Reset"], { events: { click: this.reset } })
    ];
  }
}
```

**Lifecycle Pattern:**
- Use custom methods for effects and cleanup (e.g., `destroy` for timers, listeners, etc.).
- You can call these from outside the component if you keep a reference.

### Best Practices for Stateful Components
- Always use `this.setState()` to update state and trigger reactivity.
- Use arrow functions for event handlers and custom methods to preserve `this` context.
- Encapsulate logic in methods for clarity and reuse.
- For side effects (timers, subscriptions), clean up in a custom `destroy` method or similar pattern.

---

## Testing Dockit Components

You can test Dockit components using any DOM testing library (e.g., Jest + jsdom). Here’s a simple example:

```typescript
import { Counter } from './Counter';

test('Counter increments', () => {
  const counter = new Counter(0);
  const el = counter.render();
  expect(el.textContent).toContain('Count: 0');
  // Simulate click
  el.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(el.textContent).toContain('Count: 1');
});
```

**Tips:**
- Always use `.dispatchEvent` for simulating events in tests.
- You can test stateless and stateful components the same way.

---

## Integrating Dockit as a Library

Before publishing or using Dockit as a library, **remove or comment out any demo code** in `src/index.ts` that mounts components to the DOM. This ensures Dockit can be imported cleanly into other projects:

```typescript
// Remove or comment out:
// const container = document.getElementById("app")!;
// const root = new DockitElementRoot(container, LandingPage());
// root.render();
```

Then, export your components and helpers:
```typescript
export { Component, Element, DockitElementRoot, div, h1, ... };
```

**Bundling:** Use your favorite bundler (esbuild, Rollup, etc.) to package your library for npm.

---

## Advanced Topics

### Virtual DOM & Diffing
Dockit’s virtual DOM is optimized for minimal updates. Use `key` props for list items to help Dockit track elements efficiently.

### Animations
You can define keyframe animations in the `style` prop using the `animation` property. See the source for advanced usage.

### Integration with Other Tools
Dockit works with any bundler or build tool. You can use it alongside other libraries, or even embed Dockit widgets in non-Dockit apps.

---

## Troubleshooting & FAQ

**Q: My component doesn’t update when I change state!**
- Use `this.setState()` instead of mutating `this.state` directly.
- Always call `this.updateView()` in your constructor after initializing fields.
- Ensure you are mounting with `DockitElementRoot`.

**Q: How do I use Dockit Element in a larger app?**
- Compose your app from components, and mount your root component to the DOM as shown above.
- Use a `components/` directory for organization.

**Q: Can I use Dockit Element with frameworks like React or Vue?**
- Dockit Element is a standalone library, but you can use it alongside other frameworks if needed.

**Q: How do I debug my Dockit components?**
- Use `console.log` in your `renderView` and event handlers.
- Inspect the DOM to verify updates.
- Use browser devtools to step through your code.

**Q: Why aren’t my styles applying?**
- Make sure you’re using the `style` prop, not a global CSS file.
- Check that your DockitElementRoot is rendering after the DOM is loaded.

**Q: How do I handle lists and keys?**
- Use the `key` prop on elements in lists to help Dockit track them efficiently.

---

## Contributing & Extending

- Fork the repo and submit pull requests for bug fixes or new features.
- Open issues for questions, suggestions, or bugs.
- You can extend Dockit by adding new element helpers, utilities, or improving the virtual DOM diffing.
- Dockit’s philosophy: minimal, explicit, and easy to understand. Contributions should keep this spirit.

---

## License

MIT
