# VisioBin Mini Design System

This catalog keeps common UI decisions consistent across the web dashboard and mobile app.

## Tokens

- Colors: `--brand-organic`, `--brand-inorganic`, `--bg-card`, `--bg-hover`, `--border-color`, `--text-main`, `--text-muted`.
- Radius: use `8px` for controls, `10px-12px` for cards and panels.
- Touch targets: controls should be at least `36px` on desktop and `44px` on coarse pointers/mobile.
- Motion: animations must respect `prefers-reduced-motion`.

## Components

- Button: icon plus concise label for commands. Use `type="button"` unless submitting a form. Always provide visible text or an accessible label.
- Card: use `.card` for framed content and `.glass-card` for dashboard metric cards. Avoid nested cards.
- StatusChip: compact status labels should use semantic colors: green normal, amber warning, red critical/offline, muted unknown.
- DataFreshness: use `DataFreshness` for live data recency, offline connection state, and connecting state.
- ChartFrame: use the responsive chart frame pattern in `RingkasanView` when charts need measured width and height.
- EmptyState: use `EmptyState` or `ErrorState` with a clear next action, not only explanatory copy.
- AlertItem: actionable alerts should show severity, unit/location, timestamp, and at least one operational action.

## Quality Gates

Run `npm run quality:frontend` in `web-dashboard` before pushing frontend changes. It runs targeted UI lint, transform tests, production build, and homepage smoke checks.
