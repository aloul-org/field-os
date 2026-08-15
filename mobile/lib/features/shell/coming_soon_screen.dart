import 'package:flutter/material.dart';

import '../../theme/tokens.dart';

/// Honest placeholder for a section that's routable and role-gated but whose
/// screen isn't built yet. Deliberately says so rather than showing a fake empty
/// state — the data exists on the web, so "nothing here" would be a lie.
class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          Builder(
            builder: (context) => IconButton(
              icon: Icon(Icons.menu_rounded, color: c.mutedForeground),
              onPressed: () => Scaffold.of(context).openEndDrawer(),
              tooltip: 'Menu',
            ),
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                height: 56,
                width: 56,
                decoration: BoxDecoration(
                  color: c.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(FieldRadius.lg),
                  border: Border.all(color: c.primary.withOpacity(0.2)),
                ),
                child: Icon(Icons.construction_rounded,
                    size: 26, color: c.primary),
              ),
              const SizedBox(height: 20),
              Text(
                '$title is on the way',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: c.foreground,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'This section is live in the web app. The mobile screen is '
                'being built next.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14.5,
                  height: 1.5,
                  color: c.mutedForeground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
