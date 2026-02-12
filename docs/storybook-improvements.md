# Storybook Improvements Plan

Upgrade from Storybook 8.6.15 → 10.2.8 and implement 5 workflow improvements.

## Step 0: Upgrade to Storybook 10 ✅

- Incremental upgrade 8 → 9 → 10 via `storybook upgrade`
- Automigrations applied: ESM conversion, consolidated imports, essentials removal, framework-based config
- `bun run build-storybook` passes — all 60 stories compile

## Step 1: Add `play` Functions with Interaction Tests ✅

Add `play` functions to interactive components using `storybook` built-in test utilities (`fn`, `expect`, `userEvent`, `within`).

**Target stories** (components with user interactions):

| Story | Interaction to test |
|---|---|
| `ChallengeSheet.stories.tsx` | Open sheet → select player → confirm challenge |
| `MatchScoreInput.stories.tsx` | Enter set scores → validate score display |
| `ConfirmDialog.stories.tsx` | Open dialog → click confirm → verify callback fired |
| `FormField.stories.tsx` | Type into field → verify value → show validation |
| `ReorderableList.stories.tsx` | Verify list renders with items (drag is hard to test) |
| `Toast.stories.tsx` | Trigger toast → verify it appears → auto-dismiss |

**Imports** (SB10 consolidated):
```tsx
import { within, userEvent, expect, fn } from "storybook/test";
```

## Step 2: Switch to `args` + `fn()` Pattern ✅

Refactor stories that use inline `render: () => <Comp />` to use `args` where possible, enabling the Controls + Actions panels.

**Target stories:**

| Story | Current pattern | Change |
|---|---|---|
| `PyramidGrid.stories.tsx` | `args` with `() => {}` | Replace with `fn()` |
| `DataList.stories.tsx` | `render: () => ...` | Convert to `args` where feasible |
| `StandingsTable.stories.tsx` | Check current pattern | Add `fn()` for callbacks |
| `MatchRow.stories.tsx` | Check current pattern | Add `fn()` for `onClick` |
| `PlayerCard.stories.tsx` | Check current pattern | Add `fn()` for `onClick` |

**Pattern:**
```tsx
import { fn } from "storybook/test";

const meta: Meta<typeof PyramidGrid> = {
  component: PyramidGrid,
  args: {
    onPlayerClick: fn(),
  },
};
```

## Step 3: Add `tags: ["autodocs"]` for Component Documentation ✅

Add autodocs tag to all component-level stories (ui, composites, domain) to auto-generate documentation pages with prop tables and inline stories.

**Scope:** All stories in `stories/ui/`, `stories/composites/`, and `stories/domain/` (~40 story files).

**NOT** page-level stories (`stories/pages/`) — those are full compositions, not reusable components.

**Pattern:**
```tsx
const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],  // ← add this line
};
```

## Step 4: Add `argTypes` Constraints ✅

Add `argTypes` with `control` config to components that have enum-like props, making the Controls panel more usable.

**Target components:**

| Component | Prop | Control type | Options |
|---|---|---|---|
| `MatchRow` | `status` | `select` | challenged, date_set, completed, withdrawn |
| `MatchRow` | `position` | `radio` | first, middle, last, only |
| `Badge` | `variant` | `select` | default, success, warning, error, info |
| `Button` | `variant` / `color` | `select` | (inspect component for options) |
| `EventItem` | `type` | `select` | challenge, result, withdrawal, new_player, ... |
| `PlayerCard` | `variant` | `select` | default, current, challengeable, challenged, unavailable |

## Step 5: Expand Viewport Presets + Per-Story Defaults ✅

Enhance the viewport configuration in `preview.tsx` and add per-story viewport defaults for mobile-first components.

**Updated viewports:**
```tsx
viewports: {
  iPhoneSE:  { name: "iPhone SE",  styles: { width: "375px", height: "667px" } },
  iPhone14:  { name: "iPhone 14",  styles: { width: "393px", height: "852px" } },
  tablet:    { name: "iPad",       styles: { width: "768px", height: "1024px" } },
  desktop:   { name: "Desktop",    styles: { width: "1440px", height: "900px" } },
},
```

**Per-story defaults** for mobile-centric components:
- `BottomNav` → default `iPhoneSE`
- `Sheet` → default `iPhoneSE`
- `ChallengeSheet` → default `iPhoneSE`
- `ResponsiveDialog` → default `iPhoneSE` (to show bottom sheet variant)

---

## Execution Order

1. **Step 1** — play functions (highest value, tests real interactions)
2. **Step 2** — args/fn() refactor (unlocks Controls + Actions)
3. **Step 3** — autodocs tags (trivial, high documentation value)
4. **Step 4** — argTypes constraints (improves Controls UX)
5. **Step 5** — viewport presets (quick win for responsive testing)

Each step will be verified with `bun run build-storybook` before proceeding.
