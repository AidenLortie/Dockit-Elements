# Dockit Elements -- Modular Architecture Overview

## Overview
Dockit Elements now follows a **modular architecture** designed for clarity, scalability, and long-term maintainability. Each module has a single, well-defined purpose and can be developed or tested independently.

---

## Directory Structure

```
src/
├── core/
│   ├── constants.ts         # Shared constants (CLASS_PREFIX)
│   ├── types.ts             # Centralized TypeScript type definitions
│   ├── style-registry.ts    # Style management, hashing, and CSS injection
│   ├── element-utils.ts     # Utilities for elements and prop diffing
│   ├── element.ts           # Core Element class (DOM abstraction & diffing)
│   ├── component.ts         # Stateful Component class (extends Element)
│   └── root.ts              # DockitElementRoot for mounting and coordination
├── elements.ts              # HTML element factory functions (100+ elements)
└── index.ts                 # Main public API entry point
```

---

## Module Responsibilities

### `core/constants.ts`
- Defines `CLASS_PREFIX` and other shared values.
- Prevents circular dependencies between modules.

### `core/types.ts`
- Centralized type definitions for the entire framework.
- Includes `DockitProps`, `DockitStyle`, `ComponentState`, and `ElementMeta`.

### `core/style-registry.ts`
Handles all style-related logic:
- Style normalization and hashing.
- CSS injection and class name generation.
- Scoped and reusable styles.

### `core/element-utils.ts`
Provides core utilities shared across elements:
- Global ID generation.
- Prop diffing (`propsChanged()`).
- Metadata tracking via `WeakMap`.

### `core/element.ts`
Implements the base **Element** abstraction:
- Virtual DOM representation.
- DOM creation, updates, and event handling.
- Children management and rendering.

### `core/component.ts`
Extends `Element` with reactivity and state handling:
- Adds `setState()` method for stateful updates.
- Defines abstract `renderView()` for UI composition.

### `core/root.ts`
Manages root-level orchestration:
- Handles top-level rendering and style injection.
- Serves as the entry boundary for the app.

### `elements.ts`
Exports all standard HTML element factories (e.g. `div`, `span`, `button`).
- Each factory creates native-like elements using the Dockit system.

### `index.ts`
Single public entry point:
- Re-exports all public classes, factories, and types.
- Provides stable import paths for users and downstream libraries.

---

## Design Principles

### 1. Separation of Concerns
Each module owns exactly one responsibility. Style logic never touches rendering logic, and utilities are never mixed with state handling.

### 2. Extensibility
Adding new modules or elements requires no changes to the core architecture — just import and re-export.

### 3. Maintainability
Modules are small, focused, and easy to test or replace.

### 4. Type Safety
All modules share a single, strongly-typed system through `types.ts`, ensuring consistent API behavior.

---
**Last Updated:** 2025-10-29