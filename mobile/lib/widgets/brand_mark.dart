import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// The FieldOS mark — an ink-900 squircle with a Signal Orange "F", matching
/// `public/icon.svg` in the web app (rx=96 on 512 ≈ an 18.75% corner radius).
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 40, this.showWordmark = false});

  final double size;
  final bool showWordmark;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    final mark = Container(
      height: size,
      width: size,
      decoration: BoxDecoration(
        color: FieldColors.dark.background, // ink-900, in both themes
        borderRadius: BorderRadius.circular(size * 0.1875),
      ),
      alignment: Alignment.center,
      child: Text(
        'F',
        style: TextStyle(
          fontSize: size * 0.58,
          fontWeight: FontWeight.w700,
          color: c.primary,
          height: 1,
        ),
      ),
    );

    if (!showWordmark) return mark;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        SizedBox(width: size * 0.28),
        Text(
          'FieldOS',
          style: TextStyle(
            fontSize: size * 0.5,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
            color: c.foreground,
          ),
        ),
      ],
    );
  }
}
