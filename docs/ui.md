# UI Coding Standards

This document outlines the UI coding standards for the workout plan application. **All contributors must strictly adhere to these guidelines.**

---

## Component Library

### shadcn/ui Components

**MANDATORY:** This project uses [shadcn/ui](https://ui.shadcn.com/) as the **exclusive** component library.

#### Rules

1. **ONLY use shadcn/ui components** for all UI elements
2. **ABSOLUTELY NO custom UI components** should be created
3. All UI needs must be met using shadcn/ui components
4. If a specific UI pattern is needed, find the appropriate shadcn/ui component or composition of components

#### Available Components

shadcn/ui provides a comprehensive set of components including:
- Buttons, Inputs, Forms
- Cards, Dialogs, Dropdowns
- Tables, Data Tables
- Navigation (Tabs, Menus, Breadcrumbs)
- Feedback (Alerts, Toasts, Progress)
- Layout components
- And many more

#### Adding shadcn/ui Components

When a new component is needed:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
```

This will install the component in the `components/ui/` directory with proper TypeScript types and Tailwind styling.

---

## Date Formatting

### date-fns Library

**MANDATORY:** All date formatting must be done using [date-fns](https://date-fns.org/).

#### Standard Date Format

Dates throughout the application must be formatted as:

```
1st Sep 2025
2nd Aug 2025
4th Jan 2025
```

#### Implementation

```typescript
import { format } from 'date-fns';

// Custom format function for consistent date display
export function formatStandardDate(date: Date): string {
  return format(date, 'do MMM yyyy');
}
```

#### Usage Examples

```typescript
import { formatStandardDate } from '@/lib/date-utils';

const displayDate = formatStandardDate(new Date('2025-09-01'));
// Output: "1st Sep 2025"

const displayDate2 = formatStandardDate(new Date('2025-08-02'));
// Output: "2nd Aug 2025"
```

#### Date Format Components

- **Day:** Ordinal format (`1st`, `2nd`, `3rd`, `4th`, etc.) - use `do` pattern
- **Month:** Abbreviated month name (`Jan`, `Feb`, `Sep`, etc.) - use `MMM` pattern
- **Year:** Full four-digit year (`2025`) - use `yyyy` pattern

---

## Styling

### Tailwind CSS

- Use Tailwind utility classes for all styling
- Follow the Tailwind CSS v4 conventions as outlined in the project
- Reference CSS variables defined in `app/globals.css`:
  - `--background`
  - `--foreground`
  - `--font-sans`
  - `--font-mono`

### Component Composition

When building UI:
1. Start with the appropriate shadcn/ui component
2. Customize using Tailwind utility classes
3. Extend behavior with React hooks if needed (use `"use client"` directive)
4. **Never create custom styled components from scratch**

---

## Enforcement

These standards are **non-negotiable**. Code reviews should reject:
- ❌ Custom UI components not from shadcn/ui
- ❌ Date formatting using libraries other than date-fns
- ❌ Date formats that don't match the standard format
- ❌ Direct DOM manipulation for UI elements

All UI must be:
- ✅ Built with shadcn/ui components
- ✅ Styled with Tailwind CSS
- ✅ Dates formatted with date-fns in the standard format

---

## Getting Help

- **shadcn/ui documentation:** https://ui.shadcn.com/
- **date-fns documentation:** https://date-fns.org/
- **Tailwind CSS v4:** Reference `app/globals.css` for theme configuration

---

## Summary

1. **Components:** shadcn/ui ONLY
2. **Dates:** date-fns with format `do MMM yyyy` (e.g., "1st Sep 2025")
3. **Styling:** Tailwind CSS utility classes
4. **No exceptions:** Custom UI components are strictly prohibited
