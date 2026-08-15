import 'package:flutter/material.dart';

import 'tokens.dart';

/// Builds Material [ThemeData] from the ported FieldOS tokens so Flutter's stock
/// widgets pick up the brand without per-widget styling.
ThemeData _build(FieldColors c, Brightness brightness) {
  final base = ThemeData(brightness: brightness, useMaterial3: true);

  final scheme = ColorScheme(
    brightness: brightness,
    primary: c.primary,
    onPrimary: c.primaryForeground,
    secondary: c.secondary,
    onSecondary: c.secondaryForeground,
    error: c.destructive,
    onError: c.destructiveForeground,
    surface: c.background,
    onSurface: c.foreground,
    surfaceContainerHighest: c.card,
    outline: c.border,
  );

  return base.copyWith(
    colorScheme: scheme,
    scaffoldBackgroundColor: c.background,
    extensions: [FieldTheme(colors: c)],
    dividerColor: c.border,
    dividerTheme: DividerThemeData(color: c.border, thickness: 1, space: 1),
    appBarTheme: AppBarTheme(
      backgroundColor: c.background,
      foregroundColor: c.foreground,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: c.foreground,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
    ),
    cardTheme: CardTheme(
      color: c.card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(FieldRadius.lg),
        side: BorderSide(color: c.border),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: c.primary,
        foregroundColor: c.primaryForeground,
        disabledBackgroundColor: c.muted,
        disabledForegroundColor: c.mutedForeground,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(FieldRadius.lg),
        ),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: c.foreground,
        side: BorderSide(color: c.border),
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(FieldRadius.lg),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: c.primary),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: brightness == Brightness.light ? c.popover : c.card,
      hintStyle: TextStyle(color: c.mutedForeground),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(FieldRadius.lg),
        borderSide: BorderSide(color: c.input),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(FieldRadius.lg),
        borderSide: BorderSide(color: c.input),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(FieldRadius.lg),
        borderSide: BorderSide(color: c.ring, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(FieldRadius.lg),
        borderSide: BorderSide(color: c.destructive),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: c.popover,
      indicatorColor: c.primary.withOpacity(0.12),
      elevation: 0,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: states.contains(WidgetState.selected)
              ? c.primary
              : c.mutedForeground,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          size: 22,
          color: states.contains(WidgetState.selected)
              ? c.primary
              : c.mutedForeground,
        ),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: c.foreground,
      contentTextStyle: TextStyle(color: c.background),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(FieldRadius.md),
      ),
    ),
    textTheme: base.textTheme.apply(
      bodyColor: c.foreground,
      displayColor: c.foreground,
    ),
  );
}

/// The office surface — warm paper.
final lightTheme = _build(FieldColors.light, Brightness.light);

/// The technician surface — ink-900, for outdoor glare.
final darkTheme = _build(FieldColors.dark, Brightness.dark);
