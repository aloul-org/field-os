import 'package:flutter/material.dart';

/// FieldOS AI design tokens, ported 1:1 from the web app's `app/globals.css`.
///
/// Values are written as the same HSL triples the CSS uses so the two stay
/// visually identical and diffable against each other — do not convert these to
/// hex by hand, change them alongside the CSS custom properties instead.
///
/// Signal Orange (#FF5A1F -> hsl(16 100% 56%)) on a warm "paper" neutral base.
/// Status tokens are deliberately distinct hues from the brand orange.
Color _hsl(double h, double s, double l) =>
    HSLColor.fromAHSL(1.0, h, s / 100, l / 100).toColor();

/// The light "paper" palette — the office surface.
class FieldColors {
  const FieldColors({
    required this.background,
    required this.foreground,
    required this.card,
    required this.cardForeground,
    required this.popover,
    required this.popoverForeground,
    required this.primary,
    required this.primaryForeground,
    required this.secondary,
    required this.secondaryForeground,
    required this.muted,
    required this.mutedForeground,
    required this.accent,
    required this.accentForeground,
    required this.destructive,
    required this.destructiveForeground,
    required this.success,
    required this.successForeground,
    required this.warning,
    required this.warningForeground,
    required this.border,
    required this.input,
    required this.ring,
  });

  final Color background;
  final Color foreground;
  final Color card;
  final Color cardForeground;
  final Color popover;
  final Color popoverForeground;
  final Color primary;
  final Color primaryForeground;
  final Color secondary;
  final Color secondaryForeground;
  final Color muted;
  final Color mutedForeground;
  final Color accent;
  final Color accentForeground;
  final Color destructive;
  final Color destructiveForeground;
  final Color success;
  final Color successForeground;
  final Color warning;
  final Color warningForeground;
  final Color border;
  final Color input;
  final Color ring;

  /// `:root` in globals.css — the office surface.
  static final light = FieldColors(
    background: _hsl(36, 10, 97),
    foreground: _hsl(210, 12, 9),
    card: _hsl(40, 8, 94),
    cardForeground: _hsl(210, 12, 9),
    popover: _hsl(0, 0, 100),
    popoverForeground: _hsl(210, 12, 9),
    primary: _hsl(16, 100, 56),
    primaryForeground: _hsl(0, 0, 100),
    secondary: _hsl(40, 8, 94),
    secondaryForeground: _hsl(210, 12, 9),
    muted: _hsl(40, 8, 94),
    mutedForeground: _hsl(206, 10, 40),
    accent: _hsl(23, 75, 95),
    accentForeground: _hsl(15, 88, 40),
    destructive: _hsl(0, 72, 51),
    destructiveForeground: _hsl(0, 0, 100),
    success: _hsl(142, 72, 29),
    successForeground: _hsl(0, 0, 100),
    warning: _hsl(41, 96, 40),
    warningForeground: _hsl(210, 12, 9),
    border: _hsl(41, 8, 87),
    input: _hsl(41, 8, 87),
    ring: _hsl(16, 100, 56),
  );

  /// `.dark` in globals.css — the ink-900 base, built for outdoor glare. The web
  /// app uses this for the technician surface only; mobile does the same.
  static final dark = FieldColors(
    background: _hsl(210, 12, 9),
    foreground: _hsl(36, 10, 97),
    card: _hsl(207, 9, 19),
    cardForeground: _hsl(36, 10, 97),
    popover: _hsl(207, 9, 19),
    popoverForeground: _hsl(36, 10, 97),
    primary: _hsl(16, 100, 56),
    primaryForeground: _hsl(210, 12, 9),
    secondary: _hsl(207, 9, 19),
    secondaryForeground: _hsl(36, 10, 97),
    muted: _hsl(207, 9, 19),
    mutedForeground: _hsl(206, 8, 65),
    accent: _hsl(207, 9, 24),
    accentForeground: _hsl(23, 100, 73),
    destructive: _hsl(0, 63, 50),
    destructiveForeground: _hsl(36, 10, 97),
    success: _hsl(142, 64, 42),
    successForeground: _hsl(36, 10, 97),
    warning: _hsl(38, 92, 55),
    warningForeground: _hsl(210, 12, 9),
    border: _hsl(207, 9, 24),
    input: _hsl(207, 9, 24),
    ring: _hsl(16, 100, 56),
  );
}

/// `--radius: 0.625rem` (10px) and the derived steps from tailwind.config.ts.
class FieldRadius {
  static const double lg = 10;
  static const double md = 8;
  static const double sm = 6;
  static const double pill = 999;
}

/// `--shadow-card` / `--shadow-card-hover`. Derived from ink-900 at low opacity
/// rather than the cool grey most kits ship — cards read as paper, not glass.
class FieldShadows {
  static const card = <BoxShadow>[
    BoxShadow(
      color: Color(0x0A15181B),
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x0F15181B),
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
  ];

  static const cardDark = <BoxShadow>[
    BoxShadow(
      color: Color(0x33000000),
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x4D000000),
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
  ];
}

/// Exposes [FieldColors] to widgets, so `context.colors.primary` resolves to the
/// right palette for the active theme without threading it through manually.
@immutable
class FieldTheme extends ThemeExtension<FieldTheme> {
  const FieldTheme({required this.colors});

  final FieldColors colors;

  @override
  FieldTheme copyWith({FieldColors? colors}) =>
      FieldTheme(colors: colors ?? this.colors);

  /// Palettes are discrete sets of brand tokens; interpolating between them
  /// would produce colours that exist in neither theme, so snap at the midpoint.
  @override
  FieldTheme lerp(ThemeExtension<FieldTheme>? other, double t) {
    if (other is! FieldTheme) return this;
    return t < 0.5 ? this : other;
  }
}

extension FieldThemeContext on BuildContext {
  FieldColors get colors => Theme.of(this).extension<FieldTheme>()!.colors;
}
