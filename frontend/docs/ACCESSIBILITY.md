# Accessibility

## Baseline

- Skip link to `#main-content` (single landmark id — AppShell / public mains own the target)
- Language `lang="en"` on `<html>`
- Theme support for light / dark / system with readable contrast tokens
- Focus-visible rings on interactive controls
- `prefers-reduced-motion` respected globally

## Patterns by surface

| Surface | Expectations |
|---------|----------------|
| Dialogs / menus | Base UI primitives with keyboard navigation and focus return |
| Forms | Labels (visible or `sr-only`), validation messages tied to fields |
| Tables | Column headers with `scope="col"`, row action `aria-label`s, sticky header |
| Search | Combobox semantics, active descendant, highlighted matches, recent searches |
| Charts | Prefer text summaries / table fallbacks alongside visuals |
| Offline | Assertive live region banner; dedicated `/offline` page |
| Errors | Retry actions; non-technical titles with recoverable messaging |

## Checklist for new UI

1. Can every action be reached and activated with the keyboard?
2. Does every icon-only control have an accessible name?
3. Are errors announced and associated with inputs?
4. Does focus move into modals and restore on close?
5. Is color never the only status signal?

## Known honesty notes

Permission-gated nav items are hidden rather than shown disabled when the user lacks roles/permissions. Coming-soon placeholders should use `aria-disabled` and prevent activation.
