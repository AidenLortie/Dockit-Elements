# Dockit Element — Complete Tutorial & Reference

Dockit Element is a lightweight, zero-dependency UI library for building reactive, component-based web interfaces in TypeScript or JavaScript. This tutorial will guide you from first steps to advanced usage, including best practices and integration tips.

---

## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Project Setup](#project-setup)
4. [Hello World](#hello-world)
5. [Building Components](#building-components)
    - Stateless Components
    - Stateful Components
    - Handling Props and Children
6. [Handling Events](#handling-events)
7. [Styling Components](#styling-components)
8. [Composing and Reusing Components](#composing-and-reusing-components)
9. [State and Reactivity](#state-and-reactivity)
10. [Project Structure & Best Practices](#project-structure--best-practices)
11. [Testing Dockit Components](#testing-dockit-components)
12. [Integrating Dockit as a Library](#integrating-dockit-as-a-library)
13. [Troubleshooting & FAQ](#troubleshooting--faq)
14. [Contributing & Extending](#contributing--extending)
15. [License](#license)

---

## Introduction

Dockit Element is designed for developers who want a simple, fast, and flexible way to build UI components without the overhead of large frameworks. It is ideal for:
- Embedding interactive widgets in any web project
- Building small to medium SPAs
- Learning about virtual DOM and component architectures

---

## Installation

### a) With npm (recommended)
```sh
npm install dockit-element
```

### b) Manual Copy
Copy `src/index.ts` into your project and import from there.

---

## Project Setup

Create an `index.html` with a root element:
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

If using TypeScript, ensure your `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "esnext",
    "jsx": "preserve",
    "strict": true
  }
}
```

---

## Hello World

Render a simple message to the page:
```typescript
import { div } from 'dockit-element';

document.getElementById('app').appendChild(
  div(["Hello, Dockit!"]).render()
);
```

---

## Building Components

### Stateless Components
Create reusable stateless components as functions:
```typescript
import { h1, p, div } from 'dockit-element';

function WelcomeMessage({ name }: { name: string }) {
  return div([
    h1([`Welcome, ${name}!`]),
    p(["This is your first Dockit component."])
  ]);
}

document.getElementById('app').appendChild(
  WelcomeMessage({ name: "Alice" }).render()
);
```

### Stateful Components (with `Component`)
For interactive components, extend the `Component` base class:
```typescript
import { Component, h1, button, span } from 'dockit-element';

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

document.getElementById('app').appendChild(
  new Counter(0).render()
);
```

### Handling Props and Children
You can pass props and children to your components just like in React:
```typescript
function Card({ title, children }: { title: string, children: any[] }) {
  return div([
    h1([title]),
    ...children
  ], { style: { default: { border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' } } });
}

const myCard = Card({ title: "My Card", children: [div(["Card content here!"])] });
document.getElementById('app').appendChild(myCard.render());
```

---

## Handling Events

Attach event handlers using the `events` prop:
```typescript
import { button } from 'dockit-element';

button(["Click me!"], {
  events: { click: () => alert("Button clicked!") }
});
```

---

## Styling Components

Dockit Element supports scoped styles as objects, including pseudo-selectors and media queries:
```typescript
import { div } from 'dockit-element';

const myStyle = {
  default: { color: 'purple', padding: '1rem' },
  pseudo: { ':hover': { color: 'orange' } },
  media: { '(max-width: 600px)': { fontSize: '0.8rem' } }
};

div(["Styled text!"], { style: myStyle });
```

---

## Composing and Reusing Components

You can nest and reuse components easily:
```typescript
function Card({ title, content }: { title: string, content: string }) {
  return div([
    h1([title]),
    p([content])
  ], { style: { default: { border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' } } });
}

div([
  Card({ title: "Card 1", content: "This is the first card." }),
  Card({ title: "Card 2", content: "This is the second card." })
]);
```

---

## State and Reactivity

When you call `setState` in a `Component`, Dockit Element automatically updates the DOM for you:
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
```

---

## Project Structure & Best Practices

- Use stateless functions for simple UI, and `Component` for interactive/stateful parts.
- Always call `this.updateView()` at the end of your `Component` constructor.
- Use the `style` prop for all styling to avoid global CSS conflicts.
- Compose your UI from small, reusable components.
- Organize your components in a `components/` directory for larger projects.
- Use TypeScript interfaces for props and state for type safety.

---

## Testing Dockit Components

You can test Dockit components using any DOM testing library (e.g., Jest + jsdom):
```typescript
import { Counter } from './Counter';

test('Counter increments', () => {
  const counter = new Counter(0);
  const el = counter.render();
  expect(el.textContent).toContain('Count: 0');
  // Simulate click
  el.querySelector('button').click();
  expect(el.textContent).toContain('Count: 1');
});
```

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
export { Component, Element, div, h1, ... };
```

---

## Troubleshooting & FAQ

**Q: My component doesn’t update when I change state!**
- Make sure you’re using `this.setState()` and not mutating `this.state` directly.
- Always call `this.updateView()` in your constructor after initializing fields.

**Q: How do I use Dockit Element in a larger app?**
- Compose your app from components, and mount your root component to the DOM as shown above.

**Q: Can I use Dockit Element with frameworks like React or Vue?**
- Dockit Element is a standalone library, but you can use it alongside other frameworks if needed.

**Q: How do I debug my Dockit components?**
- Use `console.log` in your `renderView` and event handlers.
- Inspect the DOM to verify updates.

---

## Contributing & Extending

- Fork the repo and submit pull requests for bug fixes or new features.
- Open issues for questions, suggestions, or bugs.
- You can extend Dockit by adding new element helpers, utilities, or improving the virtual DOM diffing.

---

## License

MIT
