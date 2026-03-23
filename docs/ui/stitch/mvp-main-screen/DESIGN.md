# Design System Specification: The Ethereal Atelier

## 1. Overview & Creative North Star
The visual identity of this design system is anchored by the **Creative North Star: "The Ethereal Atelier."** 

We are not building a utility tool; we are crafting a digital sanctuary for creators. This system moves beyond the rigid, boxy constraints of traditional apps to create a "Tokimeki" (heart-fluttering) experience. By leveraging high-contrast typography scales, intentional asymmetry, and overlapping layers, we mimic the feeling of arranging physical charms on a pristine, sunlit workbench. This is "Soft Minimalism"—where every element feels like it is floating in a dreamlike, yet structured, space.

---

## 2. Colors & Surface Philosophy
The palette utilizes sophisticated tonal shifts to guide the user’s eye, moving away from loud, flat colors toward a shimmering, translucent aesthetic.

### Surface Hierarchy & Nesting
To achieve a premium look, we treat the UI as a series of physical layers—like stacked sheets of frosted acrylic and fine paper.
- **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. 
- **Layering Logic:** 
    - Base Level: `surface` (#f5f7f9) for the main application background.
    - Section Level: `surface_container_low` (#eef1f3) to define distinct workspace areas.
    - Object Level: `surface_container_lowest` (#ffffff) for the highest-priority interactive cards, creating a "lifted" effect.

### Glass & Gradient Rule
To prevent the UI from feeling "flat," use Glassmorphism for floating panels (e.g., tool palettes or modal overlays). Apply a `backdrop-blur` of 12px–20px to `surface_container` with 80% opacity. 
- **Signature Texture:** Primary actions should use a soft radial gradient transitioning from `primary` (#69556a) to `primary_dim` (#5c495e) to provide a "soulful" depth that flat hex codes cannot achieve.

---

## 3. Typography
We utilize a pairing of **Plus Jakarta Sans** and **M PLUS Rounded 1c**. This combination balances the precision of modern geometric sans-serifs with the friendly, approachable nature of rounded Japanese Gothic.

- **Editorial Impact:** Use `display-lg` (3.5rem) for "Tokimeki" moments—welcome screens or successful creation alerts. This creates a high-end, magazine-like feel.
- **Structural Clarity:** `title-lg` (1.375rem) should be used for section headers, always paired with generous `spacing-8` (2.75rem) above to ensure the layout breathes.
- **The Human Touch:** Use `body-md` (0.875rem) for instructions. The rounded terminals of M PLUS Rounded 1c ensure that even technical jargon feels like a friendly suggestion from a fellow artist.

---

## 4. Elevation & Depth
In this design system, depth is a whisper, not a shout. We replace traditional shadows with **Tonal Layering**.

- **Ambient Shadows:** When an element must float (like a "Add to Cart" button or a floating charm), use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(105, 85, 106, 0.08)`. Notice the shadow color is a tinted version of the `primary` token, not a dead grey.
- **The "Ghost Border" Fallback:** If accessibility requirements demand a container boundary, use a "Ghost Border": the `outline_variant` token at 15% opacity. Never use 100% opacity.
- **Interactive Depth:** When a user interacts with a card, do not just change the color. Shift the surface tier (e.g., from `surface_container_low` to `surface_container_highest`) to create a tactile sense of "rising" toward the user.

---

## 5. Components

### Buttons & Interaction
- **Primary Action:** Use `primary` background with `on_primary` text. Apply `ROUND_FULL` (9999px) for a soft, pebble-like feel. 
- **Secondary Action:** Use `secondary_container` (#ffd1dc). These should feel like "Petal Pink" accents that invite a soft touch.
- **States:** Hover states should not darken; they should "glow" by applying a 10% white overlay, simulating light hitting the acrylic surface.

### Input Fields
- Avoid the "boxed-in" look. Use `surface_container_low` as a subtle background fill with no border. On focus, transition the background to `surface_container_lowest` and apply a 2px "Ghost Border" using `primary` at 20% opacity.

### Cards & Simulation Canvas
- **The Acrylic Card:** For showcasing keychain designs, use `surface_container_lowest` with `ROUND_XL` (3.0rem). 
- **No Dividers:** Forbid the use of divider lines in lists or cards. Separate content using `spacing-4` (1.4rem) or subtle background shifts between `surface_container` tiers.
- **The "Simulator" Canvas:** The main creation area should be encapsulated in a large `surface_container_lowest` area with a soft `primary_fixed_dim` inner glow to focus the artist's attention.

---

## 6. Do’s and Don’ts

### Do:
- **Use Intentional Asymmetry:** Align text to the left but allow images/charms to break the grid and overlap containers to create a "collage" feel.
- **Embrace Whitespace:** If a screen feels "busy," increase the spacing between sections using `spacing-16` (5.5rem).
- **Prioritize the "Tokimeki" Moment:** Use `secondary` (#75525b) sparingly as a "heart-beat" color for likes, favorites, or "Add to Design" actions.

### Don’t:
- **Don’t use "Pure Black":** Use `on_surface` (#2c2f31) for text to maintain the soft, ethereal contrast.
- **Don’t use Sharp Corners:** Every interactive element must use at least `ROUND_MD` (1.5rem). Sharp corners break the dreamlike atmosphere.
- **Don’t use Hard Shadows:** If you can see where the shadow starts and ends, it is too heavy. It should feel like an ambient glow.