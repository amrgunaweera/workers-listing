---
name: frontend-guidelines
description: >-
  Enforces strict usage of shadcn/ui components instead of native HTML elements for frontend tasks.
---

# Frontend Guidelines

## Overview
This skill ensures that all UI components built or refactored for this project strictly use `shadcn/ui` components (e.g. `<Button>`, `<Table>`) instead of standard HTML elements (e.g. `<button>`, `<table>`).

## Dependencies
None.

## Quick Start
Read this skill whenever starting a new frontend task or UI refactor.

## Workflow

### 1. Identify Needed Components
- Analyze the requested UI change and determine which interactive HTML elements (buttons, inputs, tables, dropdowns, etc.) are required.

### 2. Verify Component Installation
- Check `src/components/ui/` to see if the required `shadcn` component is already installed.
- If missing, run the CLI command: `npx shadcn@latest add <component_name>`.

### 3. Handle Installation Failures
- If the `shadcn` CLI fails to install the component, DO NOT attempt to build a custom Tailwind CSS fallback.
- Stop and ask the user for guidance to resolve the installation issue.

### 4. Implement UI
- Write or refactor the React code using ONLY the `shadcn/ui` components.
- Never use generic HTML inputs, buttons, or tables for interactive elements. Maintain consistency by adhering exclusively to the `shadcn` library components.

## Common Mistakes
- Silently building a custom native `<button className="...">` when the shadcn `<Button>` could easily be used or installed.
- Forgetting to import the component from `src/components/ui/...` after installing it.
