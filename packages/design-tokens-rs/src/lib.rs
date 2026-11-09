//! Typed design tokens for Rust renderers.
//!
//! One DTCG source (`packages/design-tokens/dtcg/<design>/`) generates the CSS
//! custom properties, a resolved JSON snapshot and the modules in this crate.
//! Every value is resolved at generation time: colours carry sRGB and linear
//! components, dimensions carry numbers and units. Nothing here parses CSS.
//!
//! The per-design modules (`dreamship`) are generated; this file holds only the
//! value types they use.
#![no_std]
#![forbid(unsafe_code)]

pub mod dreamship;

/// An sRGB colour. `linear` is linear-light (what a wgpu `*Srgb` target expects as shader input).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Color {
    pub hex: &'static str,
    pub srgb: [f32; 3],
    pub linear: [f32; 3],
    pub alpha: f32,
}

impl Color {
    /// Linear RGB plus alpha, e.g. for a clear colour or a uniform.
    pub const fn linear_rgba(&self) -> [f32; 4] {
        [self.linear[0], self.linear[1], self.linear[2], self.alpha]
    }
}

/// A length unit. `Em` is relative to the font size of the text it styles.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Unit {
    Px,
    Rem,
    Em,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Dimension {
    pub value: f32,
    pub unit: Unit,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Duration {
    pub ms: f32,
}

/// `[x1, y1, x2, y2]` of a CSS-style cubic Bézier easing.
pub type CubicBezier = [f32; 4];

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Typography {
    pub font_family: &'static [&'static str],
    pub font_size: Dimension,
    pub font_weight: f32,
    pub line_height: f32,
    pub letter_spacing: Dimension,
    /// OpenType feature tags switched on, e.g. `"tnum"` for tabular figures.
    pub font_features: &'static [&'static str],
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GradientStop {
    pub color: Color,
    /// 0..1 along the gradient line.
    pub position: f32,
}

/// A linear gradient; `angle_deg` follows CSS (180 = top to bottom).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Gradient {
    pub angle_deg: f32,
    pub stops: &'static [GradientStop],
}

#[cfg(test)]
mod tests {
    use super::dreamship::{DARK, DEFAULT, LIGHT, THEMES};

    #[test]
    fn default_theme_is_dark_and_every_theme_is_listed() {
        assert_eq!(DEFAULT, &DARK);
        let names: [&str; 2] = [THEMES[0].0, THEMES[1].0];
        assert_eq!(names, ["dark", "light"]);
    }

    #[test]
    fn semantic_colours_resolve_through_the_palette() {
        assert_eq!(DARK.color_surface_page.hex, "#06090C");
        assert_eq!(DARK.color_surface_page, DARK.color_palette_night);
        assert_eq!(LIGHT.color_content_primary.hex, "#0B0D10");
        assert_eq!(LIGHT.component_button_primary_fill, LIGHT.color_action_fill);
        assert_eq!(DARK.color_border_control.hex, "#5C6D73");
        assert_eq!(DARK.typography_operational_numeric.font_features, &["tnum", "lnum"]);
        assert_eq!(LIGHT.color_border_selected, LIGHT.color_palette_ink);
    }

    #[test]
    fn linear_values_are_the_srgb_transfer_of_srgb() {
        for (_, theme) in THEMES {
            let c = theme.color_content_secondary;
            for i in 0..3 {
                let s = c.srgb[i];
                let expected = if s <= 0.04045 { s / 12.92 } else { libm_pow((s + 0.055) / 1.055, 2.4) };
                assert!((c.linear[i] - expected).abs() < 1e-4, "{} channel {i}", c.hex);
            }
        }
    }

    // no_std has no powf; exp/ln by series is enough for a test tolerance of 1e-4.
    fn libm_pow(base: f32, exp: f32) -> f32 {
        let x = base as f64;
        let y = exp as f64;
        let ln = {
            // ln(x) for x in (0, 1]: atanh series on (x-1)/(x+1).
            let t = (x - 1.0) / (x + 1.0);
            let mut sum = 0.0;
            let mut term = t;
            let mut n = 1.0;
            while n < 200.0 {
                sum += term / n;
                term *= t * t;
                n += 2.0;
            }
            2.0 * sum
        };
        let z = ln * y;
        let mut sum = 1.0;
        let mut term = 1.0;
        for k in 1..60 {
            term *= z / k as f64;
            sum += term;
        }
        sum as f32
    }
}
