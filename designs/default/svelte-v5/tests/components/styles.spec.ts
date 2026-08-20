import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// CSS-source contract tests.
//
// jsdom does not apply the CSS that components `import`, so computed-style
// assertions are not available here. These tests assert against the stylesheet
// *source* instead, which is what actually ships in `dist/`. They exist to stop
// regressions that are invisible to render tests: a missing focus ring, a
// silently-undefined token behind a fallback, or a meter that is the same
// colour as the card it sits on.

const COMPONENTS = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../src/lib/components",
);

const css = (name: string) => readFileSync(join(COMPONENTS, name), "utf8");

describe("focus visibility", () => {
  // Unlike default-react-v18, this package ships no global base.css, so every
  // interactive component must carry its own :focus-visible rule.
  it.each([
    ["button/button.css", "button[data-variant]:focus-visible"],
    ["toggle/toggle.css", "button[data-state]:focus-visible"],
    ["card/card.css", '.card[data-state="interactive"]:focus-visible'],
  ])("%s declares %s", (file, selector) => {
    expect(css(file)).toContain(selector);
  });

  it.each(["button/button.css", "toggle/toggle.css", "card/card.css"])(
    "%s draws the focus ring from --ds-focus-ring with an offset",
    (file) => {
      const block = css(file).slice(css(file).indexOf(":focus-visible"));
      expect(block).toContain("outline: var(--ds-focus-ring)");
      expect(block).toContain("outline-offset:");
    },
  );
});

describe("font weight", () => {
  // The type stack is system fonts only — this repo ships no @font-face — so
  // 500 is not a portable weight: classic Segoe UI has no Medium and CSS font
  // matching resolves 500 down to 400 on Windows, making it a silent no-op.
  it.each(["button/button.css", "badge/badge.css"])(
    "%s uses a weight that is real in every family in the stack",
    (file) => {
      expect(css(file)).not.toMatch(/font-weight:\s*500/);
      expect(css(file)).toContain("font-weight: 600");
    },
  );
});

describe("token discipline", () => {
  const ALL = [
    "badge/badge.css",
    "button/button.css",
    "card/card.css",
    "meter/meter.css",
    "parallax/parallax.css",
    "tag/tag.css",
    "toggle/toggle.css",
  ];

  // A `var(--ds-x, fallback)` renders fine even when --ds-x does not exist, so
  // an undefined token never surfaces: the component quietly ships the
  // fallback's shape instead of the designed one, and nothing in CI notices.
  // No fallbacks — a missing token must fail loudly.
  it.each(ALL)("%s references --ds-* tokens without fallbacks", (file) => {
    const offenders = css(file).match(/var\(--ds-[a-z0-9-]+\s*,/g) ?? [];
    expect(offenders).toEqual([]);
  });
});

describe("tag", () => {
  it("is a pill: it uses --ds-radius-full", () => {
    expect(css("tag/tag.css")).toContain("border-radius: var(--ds-radius-full)");
  });

  it("does not paint itself the same colour as the card it sits on", () => {
    expect(css("tag/tag.css")).not.toContain("background: var(--ds-color-surface);");
  });
});

describe("surface-collision", () => {
  // Systemic: --ds-color-surface is Card's own background, so any component
  // that paints a resting or hover fill with it disappears on a card — the
  // common case. Card itself is the only legitimate user of the token.
  it.each([
    "badge/badge.css",
    "button/button.css",
    "meter/meter.css",
    "tag/tag.css",
  ])("%s never fills with --ds-color-surface", (file) => {
    const fills =
      css(file).match(/(?:background|background-color):\s*var\(--ds-color-surface\)/g) ??
      [];
    expect(fills).toEqual([]);
  });

  it("card is the one component that does paint with --ds-color-surface", () => {
    expect(css("card/card.css")).toContain("background: var(--ds-color-surface);");
  });

  it("ghost button hovers to an ink wash, so it works on any background", () => {
    expect(css("button/button.css")).toContain(
      "color-mix(in oklab, var(--ds-color-fg) 8%, transparent)",
    );
  });

  it("primary button hovers via the theme-aware accent-hover token", () => {
    // Not --ds-color-brand-600: that ramp step is darker than the dark
    // theme's accent, which made hover run backwards in dark mode.
    expect(css("button/button.css")).toContain("var(--ds-color-accent-hover)");
    expect(css("button/button.css")).not.toContain("var(--ds-color-brand-600)");
  });
});

describe("meter", () => {
  const meter = css("meter/meter.css");

  // --ds-color-surface is what card.css paints itself with, so a meter track
  // in that colour disappears into any card and an empty meter reads as a
  // hairline rather than a control. surface-raised is the scale's
  // "thing-on-a-card" level.
  it("uses surface-raised for the track, not the card's own surface", () => {
    expect(meter).toContain("background: var(--ds-color-surface-raised)");
    expect(meter).not.toContain("background: var(--ds-color-surface);");
  });

  it("delineates the track with a border that clears 3:1 against a card", () => {
    expect(meter).toContain(
      "color-mix(in oklab, var(--ds-color-border), var(--ds-color-fg) 40%)",
    );
  });

  it.each([
    ["accent", "--ds-color-accent"],
    ["success", "--ds-color-success"],
    ["warning", "--ds-color-warning"],
    ["danger", "--ds-color-danger"],
    ["neutral", "--ds-color-text-muted"],
  ])("colours the %s tone fill from var(%s)", (tone, token) => {
    expect(meter).toContain(`.meter[data-tone="${tone}"] .meter__fill`);
    expect(meter).toContain(`var(${token})`);
  });
});

describe("public stylesheet", () => {
  const styles = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../../src/lib/styles.css"),
    "utf8",
  );

  // Every component exported from index.ts must be reachable from the single
  // public stylesheet, for consumers that load styles.css rather than relying
  // on their bundler to follow each component's own CSS import.
  it.each([
    "badge",
    "button",
    "toggle",
    "card",
    "meter",
    "tag",
    "parallax",
  ])("imports %s", (name) => {
    expect(styles).toContain(`./components/${name}/${name}.css`);
  });
});
