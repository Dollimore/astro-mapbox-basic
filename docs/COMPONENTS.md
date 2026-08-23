# COMPONENTS — the kit reference

Ten components in `src/components/kit/`. Composed, never modified or restyled.

| Component | Props | Behaviour / rules |
|---|---|---|
| **HeadlineBlock** | `title`, `subline?`, `live?`, `children?` | Glass panel, top-left. `live` renders a pulsing dot and a UTC clock. Title in `--font-ui`. |
| **TimePanel** | `range`, `value`, `interval?`, `onChange`, `playable?`, `playing?`, `onPlayToggle?` | The Electricity-Maps scrubber: bottom-left, current value large, play/pause, interval chip, tick-marked track. Hero-mechanic host for temporal maps. |
| **LegendCanvas** | `mode: "swatches" \| "gradient"`, `title`, `items \| stops` | Bottom-right. Gradient mode is a labelled colour ramp. Always visible, never a menu. |
| **CounterStrip** | `primary`, `secondary?`, `methodHref?` | One primary number, large, mono, count-up on change. `methodHref` renders "(how we estimate)". |
| **HintToast** | `text`, `showOnce?` | Single-interaction teacher. Glass chip, fades on the first pointer/key/wheel event. |
| **StoryPin** | `n`, `lngLat`, `title`, `line`, `screen` | Numbered pin opening a glass mini-card. Max ~4 per map. `screen` comes from `map.project()`. |
| **StoryCard** | `title`, `body?`, `stat?`, `onClose?` | The click-a-feature card: compact, one stat highlighted. |
| **Chip** | `label`, `active?`, `onClick?` | Filter and interval chips. Glide hover. |
| **ControlStack** / **ControlButton** | `children` / `label`, `onClick?`, `children` | Top-right vertical stack of glass squares. |
| **StampMark** | `lat`, `lng`, `label?`, `variant?` | Static coordinates mark, square radius, mono. |

## Layout grammar

Top-left `HeadlineBlock` (+ `CounterStrip`) · top-centre optional status badge ·
top-right `ControlStack` · bottom-left `TimePanel` · bottom-right `LegendCanvas`.
Nothing else floats. Mobile docks panels to a bottom sheet; the map stays full-bleed.

## The composition rule

Kit components hold zero visual opinions. Every value comes from `src/theme/`.
Restyling means editing the theme folder, never a component. `npm run check:tokens`
fails the build on any colour literal outside `src/theme/`.

## The portability rule

No Astro-specific API inside `src/components/kit/`, and no CSS-framework utility or
import. Components are plain React plus a co-located plain-CSS file, so they drop
into a future Vite sibling unchanged. `check:tokens` enforces both.

## One trap worth knowing

Theme colours live in CSS custom properties, which resolve only once the stylesheet
is applied. Reading them **in a render body** returns `transparent` on the hydration
pass. Use `useStatusColours()` from `src/lib/`, which resolves after mount.
