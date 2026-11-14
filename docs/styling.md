# Styling & UI

## Tailwind CSS v4

Configured through the Vite plugin; there is no `tailwind.config.js`. Everything lives in `src/app/globals.css`:

- `:root` / `.dark` — design tokens as CSS variables (oklch colors, radius).
- `@theme inline` — exposes the tokens as utilities (`bg-primary`, `text-muted-foreground`, `rounded-lg`…).
- `@layer base` — global element styles.

Use the semantic tokens (`bg-card`, `text-destructive`, `border-border`) instead of raw palette colors, so dark mode and re-theming just work. Extra tokens beyond shadcn's: `success`, `warning` (+ `warning-border`), `info`, `chart-1…5`, `sidebar-*`.

### Re-theming

Generate a palette at [ui.shadcn.com/themes](https://ui.shadcn.com/themes) (or [tweakcn](https://tweakcn.com)) and paste the variables into `:root` and `.dark`. Change the font in `index.html` (Google Fonts link) and `--font-sans`.

### Dark mode

`ThemeProvider` toggles `.dark` on `<html>` and stores the choice (`appConfig.storageKeys.theme`). An inline script in `index.html` applies it before React loads (no flash). Use `useTheme()` to read/set it; `ModeToggle` is a ready-made menu.

## Class names

- `cn(...)` merges classes and resolves Tailwind conflicts.
- `cva` (class-variance-authority) for variant-based components (see `button.tsx`, `alert.tsx`).
- Prettier sorts classes automatically (also inside `cn()` / `cva()`).

## Component kit (`src/shared/ui`)

| Folder        | Contents                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `primitives/` | shadcn/ui components (button, input, select, dialog, sheet, dropdown, table, field, avatar…) |
| `form/`       | React Hook Form fields, `FormSheet`, `FormErrorAlert`, `useZodForm`                          |
| `data/`       | `PaginatedTable`, `QueryTable`, filters, `DetailSheet`, `Status`                             |
| `feedback/`   | `Alert`, `EmptyState`, `ErrorState`, `PageSkeleton`, `ActionDialog`, `UnsavedChangesGuard`   |
| `layout/`     | `AppShell`, `PageHeader`, `SectionCard`, `DataGrid`, `StatCard`, `Tabs`, `SubNav`, `Stepper` |
| `theme/`      | `ThemeProvider`, `useTheme`, `ModeToggle`                                                    |

### Adding shadcn components

`components.json` points the shadcn CLI at this layout:

```bash
pnpm dlx shadcn@latest add tooltip popover calendar
```

They land in `src/shared/ui/primitives`. They are your code now: edit freely.

## Icons

[lucide-react](https://lucide.dev): `import { Plus } from 'lucide-react'`. Inside buttons, icons are sized automatically.

## Accessibility checklist

The kit already handles focus rings, `aria-*` on tables/tabs/dialogs, `sr-only` labels and reduced motion. When building new UI: label every input, give icon-only buttons an `aria-label`, never use color as the only signal (`Status` always pairs color with text).
