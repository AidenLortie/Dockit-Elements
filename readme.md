# Dockit Element — Getting Started Guide

Dockit Element is a lightweight, zero-dependency UI library for building reactive web interfaces in TypeScript or JavaScript.

**Perfect for:**
- Developers new to component-based UI development
- Projects that need interactive widgets without heavy frameworks
- Learning how modern UI libraries work under the hood

**Philosophy:** Start simple, build up gradually. No magic, no hidden complexity—just clear, explicit code that you control.

---

## Table of Contents

**Getting Started**
- 1. [What is Dockit Element?](#what-is-dockit-element)
- 2. [Installation](#installation)
- 3. [Your First Element](#your-first-element)
- 4. [Displaying Your App](#displaying-your-app)
- 5. [Project Setup](#project-setup)

**Building with Elements**
- 6. [Creating Elements](#creating-elements)
- 7. [Adding Styles](#adding-styles)
- 8. [Handling User Events](#handling-user-events)

**Working with Components**
- 9. [Simple Components (Functions)](#simple-components-functions)
- 10. [Interactive Components (Classes)](#interactive-components-classes)
- 11. [Composing Components](#composing-components)

**Advanced Features**
- 12. [How Reactivity Works](#how-reactivity-works)
- 13. [Animations and Transitions](#animations-and-transitions)
- 14. [Advanced Patterns](#advanced-patterns)
- 15. [Testing Your Components](#testing-your-components)
- 16. [Publishing as a Library](#publishing-as-a-library)

**Reference**
- 17. [Troubleshooting & FAQ](#troubleshooting--faq)
- 18. [Contributing](#contributing)
- 19. [License](#license)

---

## What is Dockit Element?

Dockit Element helps you build web interfaces using **elements** and **components**.

- **Elements** are individual pieces of UI like buttons, divs, or paragraphs
- **Components** are reusable collections of elements that can manage their own behavior
- **Reactivity** means your UI automatically updates when data changes

Think of it like building with LEGO blocks—start with simple pieces, then combine them into more complex structures.

---

## Installation

**Using npm (recommended):**
```sh
npm install dockit-element
```

**Manual installation:**
Copy `src/index.ts` into your project and import from there.

---

## Your First Element

Let's create the simplest possible Dockit app—a single text element:

```typescript
import { div } from 'dockit-element';

// Create a div element with text inside
const myElement = div(["Hello, World!"]);
```

That's it! You've created your first Dockit element. The `div()` function creates a virtual element that represents an HTML `<div>`.

**Other elements:**
Dockit provides functions for all standard HTML elements:
```typescript
import { h1, p, button, span } from 'dockit-element';

const heading = h1(["Welcome!"]);
const paragraph = p(["This is a paragraph."]);
const btn = button(["Click me!"]);
```

---

## Displaying Your App

To show your elements in the browser, you need two things:

**1. An HTML file with a container:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Dockit App</title>
</head>
<body>
  <div id="app"></div>
  <script src="dist/bundle.js"></script>
</body>
</html>
```

**2. Mount your element to the container:**
```typescript
import { div, DockitElementRoot } from 'dockit-element';

// Create an element
const myElement = div(["Hello, Dockit!"]);

// Find the container in your HTML
const container = document.getElementById('app')!;

// Create a root and render
const root = new DockitElementRoot(container, myElement);
root.render();
```

**What's happening here?**
- `DockitElementRoot` is your app's entry point—it connects your Dockit elements to the actual browser DOM
- `container` is where your app will appear on the page
- `render()` displays your element in the browser

**Updating your app:**
- To replace the entire app: `root.replace(newElement)`
- To re-render after changes: `root.update()`

---

## Project Setup

A typical Dockit project structure:

```
my-app/
  src/
    index.ts         # Your app entry point
    components/      # Your Dockit components (optional)
  public/
    index.html       # Your HTML file
  package.json
  tsconfig.json
```

**Minimal tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "esnext",
    "strict": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

**Build with:**
```sh
npm run build    # Compile TypeScript
```

You'll need a bundler (like esbuild, webpack, or vite) to create the `bundle.js` file referenced in your HTML.

---

## Creating Elements

Elements can be nested and combined to create complex UIs:

```typescript
import { div, h1, p, button } from 'dockit-element';

const myCard = div([
  h1(["Welcome to Dockit"]),
  p(["Build amazing UIs with ease."]),
  button(["Get Started"])
]);
```

**Key concepts:**
- Elements take an array of children as the first argument
- Children can be strings (text) or other elements
- You can nest elements as deeply as needed

**Adding attributes:**
```typescript
import { div, input } from 'dockit-element';

const myInput = input([], {
  id: "username",
  placeholder: "Enter your name",
  type: "text"
});

const container = div([myInput], {
  id: "input-container",
  className: "form-group"
});
```

The second argument to element functions is an options object where you can specify:
- `id`: Element ID
- `className`: CSS classes
- `style`: Inline or scoped styles (more on this below)
- `events`: Event handlers
- Any other HTML attributes

---

## Adding Styles

Dockit supports powerful scoped styling that's automatically managed for you.

**Basic styling:**
```typescript
import { div } from 'dockit-element';

const styledDiv = div(["Styled content"], {
  style: {
    default: {
      color: 'blue',
      padding: '20px',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px'
    }
  }
});
```

**Hover effects (pseudo-selectors):**
```typescript
const hoverDiv = div(["Hover over me!"], {
  style: {
    default: {
      padding: '1rem',
      backgroundColor: '#4e54c8',
      color: 'white',
      cursor: 'pointer'
    },
    pseudo: {
      ':hover': {
        backgroundColor: '#8f94fb',
        transform: 'scale(1.05)'
      }
    }
  }
});
```

**Responsive styles (media queries):**
```typescript
const responsiveDiv = div(["I adapt to screen size"], {
  style: {
    default: {
      fontSize: '24px',
      padding: '2rem'
    },
    media: {
      '(max-width: 600px)': {
        fontSize: '16px',
        padding: '1rem'
      }
    }
  }
});
```

**Why this is powerful:**
- Styles are scoped to components (no global CSS conflicts)
- Dockit automatically generates unique class names
- Styles are injected into the document only when needed
- Full TypeScript support with autocomplete

---

## Handling User Events

Add interactivity with event handlers:

```typescript
import { button } from 'dockit-element';

const clickableButton = button(["Click me!"], {
  events: {
    click: () => {
      alert("Button clicked!");
    }
  }
});
```

**Multiple events:**
```typescript
const input = input([], {
  events: {
    input: (e) => console.log("Value:", e.target.value),
    focus: () => console.log("Input focused"),
    blur: () => console.log("Input blurred")
  }
});
```

**Common events:** `click`, `input`, `change`, `submit`, `focus`, `blur`, `keydown`, `keyup`, `mouseenter`, `mouseleave`

---

## Simple Components (Functions)

Components are reusable pieces of UI. The simplest form is a function that returns elements:

```typescript
import { div, h1, p } from 'dockit-element';

function WelcomeCard({ name, message }: { name: string; message: string }) {
  return div([
    h1([`Welcome, ${name}!`]),
    p([message])
  ], {
    style: {
      default: {
        border: '1px solid #ccc',
        padding: '1rem',
        borderRadius: '8px'
      }
    }
  });
}

// Use it:
const card = WelcomeCard({
  name: "Alice",
  message: "Thanks for using Dockit!"
});

const root = new DockitElementRoot(
  document.getElementById('app')!,
  card
);
root.render();
```

**When to use function components:**
- Simple, presentational UI
- Components that don't need their own state
- Reusable UI patterns

---

## Interactive Components (Classes)

For components that need to manage state and update themselves, use class-based components:

```typescript
import { Component, div, h1, button, span, DockitElementRoot } from 'dockit-element';

class Counter extends Component<{ count: number }> {
  constructor(initialCount = 0) {
    super({ count: initialCount });
    this.updateView();  // Important: initialize the view
  }

  renderView() {
    this.children = [
      h1(["Counter App"]),
      div([
        span([`Current count: ${this.state.count}`])
      ]),
      button(["Increment"], {
        events: {
          click: () => {
            // setState automatically updates the UI
            this.setState({ count: this.state.count + 1 });
          }
        }
      }),
      button(["Reset"], {
        events: {
          click: () => this.setState({ count: 0 })
        }
      })
    ];
  }
}

// Use it:
const root = new DockitElementRoot(
  document.getElementById('app')!,
  new Counter(0)
);
root.render();
```

**Key points:**
1. Extend `Component<StateType>` where `StateType` is your state object shape
2. Initialize state in `super(initialState)`
3. Call `this.updateView()` at the end of the constructor
4. Define your UI in `renderView()` method
5. Update state with `this.setState()` - this triggers automatic re-rendering

**When to use class components:**
- Interactive UI that responds to user input
- Components that manage their own data
- Complex UI with multiple state values

---

## Composing Components

Build complex UIs by combining simple components:

```typescript
import { Component, div, h1, p, button } from 'dockit-element';

// Simple function component
function Card({ title, content }: { title: string; content: string }) {
  return div([
    h1([title]),
    p([content])
  ], {
    style: {
      default: {
        border: '1px solid #ddd',
        padding: '1rem',
        margin: '0.5rem',
        borderRadius: '4px'
      }
    }
  });
}

// Stateful component using simple components
class CardList extends Component<{ cards: Array<{ title: string; content: string }> }> {
  constructor() {
    super({
      cards: [
        { title: "Card 1", content: "First card content" },
        { title: "Card 2", content: "Second card content" }
      ]
    });
    this.updateView();
  }

  addCard = () => {
    const newCard = {
      title: `Card ${this.state.cards.length + 1}`,
      content: `Card ${this.state.cards.length + 1} content`
    };
    this.setState({
      cards: [...this.state.cards, newCard]
    });
  };

  renderView() {
    this.children = [
      button(["Add Card"], {
        events: { click: this.addCard }
      }),
      div(
        this.state.cards.map(card => Card(card))
      )
    ];
  }
}
```

**Composition patterns:**
- Use function components for presentational pieces
- Use class components for interactive containers
- Pass data down through props
- Keep components focused on a single responsibility

---

## How Reactivity Works

Dockit uses a virtual DOM to efficiently update your UI. Here's what happens:

**1. You create elements:**
```typescript
const myElement = div(["Hello"]);
```
This creates a virtual representation of the UI in memory.

**2. Dockit renders to the real DOM:**
```typescript
root.render();
```
Dockit converts the virtual elements into actual DOM elements.

**3. When state changes:**
```typescript
this.setState({ count: this.state.count + 1 });
```

Dockit:
- Updates the component's state
- Calls `renderView()` to create a new virtual tree
- Compares the new tree with the old one (diffing)
- Updates only the parts of the real DOM that changed

**Why this matters:**
- Updates are fast (only changed parts are updated)
- You don't need to manually manipulate the DOM
- Your code stays simple and declarative

**Performance tip:** For large lists, use the `key` prop to help Dockit track items:
```typescript
div(
  items.map(item => 
    div([item.name], { key: item.id })
  )
)
```

---

## Animations and Transitions

Add visual polish with CSS animations and transitions:

**Simple transitions:**
```typescript
const fadeIn = div(["I fade in!"], {
  style: {
    default: {
      animation: 'fadeIn 1s ease-in',
      padding: '1rem',
      backgroundColor: '#4e54c8',
      color: 'white'
    },
    animation: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      options: {
        name: 'fadeIn',
        duration: 1000,
        easing: 'ease-in'
      }
    }
  }
});
```

**Hover transitions:**
```typescript
const hoverButton = button(["Hover me"], {
  style: {
    default: {
      padding: '10px 20px',
      backgroundColor: '#4e54c8',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    pseudo: {
      ':hover': {
        backgroundColor: '#8f94fb',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
      }
    }
  }
});
```

**State-based animations:**
```typescript
class FadeToggle extends Component<{ visible: boolean }> {
  constructor() {
    super({ visible: true });
    this.updateView();
  }

  toggle = () => {
    this.setState({ visible: !this.state.visible });
  };

  renderView() {
    const fadeStyle = {
      default: {
        animation: this.state.visible ? 'fadeIn 0.5s' : 'fadeOut 0.5s',
        animationFillMode: 'forwards'
      },
      animation: {
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' }
          },
          fadeOut: {
            '0%': { opacity: '1' },
            '100%': { opacity: '0' }
          }
        }
      }
    };

    this.children = [
      button([this.state.visible ? "Hide" : "Show"], {
        events: { click: this.toggle }
      }),
      this.state.visible ? div(["Hello!"], { style: fadeStyle }) : null
    ];
  }
}
```

---

## Advanced Patterns

### Custom Methods and Lifecycle

Add custom methods to encapsulate complex logic:

```typescript
class Timer extends Component<{ seconds: number; running: boolean }> {
  private interval?: number;

  constructor() {
    super({ seconds: 0, running: false });
    this.updateView();
  }

  start = () => {
    if (!this.state.running) {
      this.setState({ running: true });
      this.interval = window.setInterval(() => {
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
    this.stop();
    this.setState({ seconds: 0 });
  };

  // Cleanup when component is removed
  destroy = () => {
    this.stop();
  };

  renderView() {
    this.children = [
      h1([`Time: ${this.state.seconds}s`]),
      button([this.state.running ? "Stop" : "Start"], {
        events: {
          click: this.state.running ? this.stop : this.start
        }
      }),
      button(["Reset"], {
        events: { click: this.reset }
      })
    ];
  }
}
```

### Props and Children Pattern

Pass dynamic content to components:

```typescript
function Container({ title, children }: { title: string; children: any[] }) {
  return div([
    h1([title]),
    div(children, {
      style: {
        default: { padding: '1rem' }
      }
    })
  ], {
    style: {
      default: {
        border: '2px solid #ccc',
        borderRadius: '8px',
        margin: '1rem'
      }
    }
  });
}

// Use it:
const myContainer = Container({
  title: "My Section",
  children: [
    p(["This is some content."]),
    button(["Click me!"])
  ]
});
```

### Best Practices

**Do:**
- Always use `this.setState()` to update state
- Use arrow functions for event handlers to preserve `this`
- Keep components small and focused
- Extract reusable UI into function components
- Clean up timers and subscriptions in a `destroy` method

**Don't:**
- Mutate `this.state` directly
- Forget to call `this.updateView()` in the constructor
- Create deeply nested component trees (split into smaller components)
- Mix global CSS with scoped styles (stick to one approach)

---

## Testing Your Components

Test Dockit components using any DOM testing library (e.g., Jest with jsdom):

```typescript
import { Counter } from './Counter';

describe('Counter', () => {
  test('starts at initial value', () => {
    const counter = new Counter(5);
    const el = counter.render();
    expect(el.textContent).toContain('5');
  });

  test('increments when button clicked', () => {
    const counter = new Counter(0);
    const el = counter.render();
    
    const button = el.querySelector('button')!;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(el.textContent).toContain('1');
  });

  test('resets to zero', () => {
    const counter = new Counter(10);
    const el = counter.render();
    
    const resetButton = el.querySelectorAll('button')[1];
    resetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(el.textContent).toContain('0');
  });
});
```

**Testing tips:**
- Use `.dispatchEvent()` to simulate user interactions
- Query the rendered element with standard DOM methods
- Test both function and class components the same way
- Focus on user-visible behavior, not implementation details

---

## Publishing as a Library

To use Dockit components as a library in other projects:

**1. Clean up your entry point:**

Remove any demo code from `src/index.ts`:
```typescript
// Remove or comment out:
// const container = document.getElementById("app")!;
// const root = new DockitElementRoot(container, MyApp());
// root.render();
```

**2. Export your components:**
```typescript
// src/index.ts
export { Component, Element, DockitElementRoot };
export { div, span, h1, h2, p, button, input /* ... all elements */ };
export { MyCustomComponent } from './components/MyCustomComponent';
```

**3. Configure package.json:**
```json
{
  "name": "my-dockit-library",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

**4. Build and publish:**
```sh
npm run build
npm publish
```

**Using your library:**
```typescript
import { Component, div, button } from 'my-dockit-library';
import { MyCustomComponent } from 'my-dockit-library';
```

---

## Troubleshooting & FAQ

### My component doesn't update!

**Problem:** State changes but UI doesn't update.

**Solutions:**
- ✅ Use `this.setState()` instead of directly modifying `this.state`
- ✅ Make sure you called `this.updateView()` at the end of the constructor
- ✅ Verify you're using `DockitElementRoot` to mount your app

### Styles aren't applying

**Problem:** My styles don't appear in the browser.

**Solutions:**
- ✅ Use the `style` prop on elements, not external CSS files
- ✅ Ensure `DockitElementRoot` has rendered (styles are injected during render)
- ✅ Check browser DevTools to verify the styles are in the `<style>` tag
- ✅ Make sure you're using the `default` property in the style object

### Event handlers aren't working

**Problem:** Click events or other events don't fire.

**Solutions:**
- ✅ Use arrow functions: `{ click: () => this.handleClick() }` not `{ click: this.handleClick }`
- ✅ Verify the event name is correct (`click`, not `onClick`)
- ✅ Check that the element has been rendered to the DOM
- ✅ Make sure the event handler is in the `events` prop

### TypeScript errors

**Problem:** TypeScript complains about types.

**Solutions:**
- ✅ Use `document.getElementById('app')!` (with `!`) to assert the element exists
- ✅ Define your state type: `class MyComponent extends Component<{ count: number }>`
- ✅ Ensure your `tsconfig.json` has `"strict": true`

### How do I handle forms?

```typescript
class LoginForm extends Component<{ username: string; password: string }> {
  constructor() {
    super({ username: '', password: '' });
    this.updateView();
  }

  handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log('Login:', this.state);
  };

  renderView() {
    this.children = [
      form([
        input([], {
          type: 'text',
          placeholder: 'Username',
          events: {
            input: (e) => this.setState({ username: (e.target as HTMLInputElement).value })
          }
        }),
        input([], {
          type: 'password',
          placeholder: 'Password',
          events: {
            input: (e) => this.setState({ password: (e.target as HTMLInputElement).value })
          }
        }),
        button(['Login'], { type: 'submit' })
      ], {
        events: { submit: this.handleSubmit }
      })
    ];
  }
}
```

### Can I use Dockit with other frameworks?

Yes! Dockit is standalone and can coexist with other libraries. You can:
- Embed Dockit widgets in React/Vue apps
- Use Dockit alongside jQuery
- Mount multiple independent Dockit apps on the same page

Just make sure each `DockitElementRoot` has its own container element.

### How do I debug?

- Use `console.log` in your `renderView()` and event handlers
- Inspect the DOM with browser DevTools
- Add breakpoints in your code
- Check the `<style>` tag to see generated CSS
- Use React DevTools or similar browser extensions won't work (Dockit is not React)

---

## Contributing

We welcome contributions!

**How to contribute:**
1. Fork [the repository](https://github.com/AidenLortie/Dockit-Elements)
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Submit a pull request

**What to contribute:**
- Bug fixes
- New element helpers
- Documentation improvements
- Performance optimizations
- Example projects

**Guidelines:**
- Keep it simple and explicit (Dockit's philosophy)
- Update documentation
- Follow existing code style

**Questions or ideas?**
- Open an issue on GitHub
- Start a discussion

---

## License

MIT License

Copyright (c) 2025 Dockit Elements

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
