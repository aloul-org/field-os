import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/team_role.dart';
import '../../theme/tokens.dart';
import '../../widgets/brand_mark.dart';
import '../auth/session_controller.dart';

/// Nav metadata for a section — the mobile counterpart of the web sidebar's
/// `nav-items.ts`.
class SectionNav {
  const SectionNav(this.section, this.label, this.icon, this.route);

  final AppSection section;
  final String label;
  final IconData icon;
  final String route;
}

/// Every section, in the web sidebar's group order (sales → operations → money
/// → insights → workspace). Filtered per role by [accessibleSections].
const allSections = <SectionNav>[
  SectionNav(AppSection.estimates, 'Estimates', Icons.description_outlined,
      '/estimates'),
  SectionNav(AppSection.leads, 'Leads', Icons.inbox_outlined, '/leads'),
  SectionNav(AppSection.calls, 'Calls', Icons.phone_outlined, '/calls'),
  SectionNav(AppSection.customers, 'Customers', Icons.people_outline,
      '/customers'),
  SectionNav(AppSection.schedule, 'Schedule', Icons.calendar_today_outlined,
      '/schedule'),
  SectionNav(AppSection.jobs, 'Jobs', Icons.build_outlined, '/jobs'),
  SectionNav(AppSection.materials, 'Materials', Icons.inventory_2_outlined,
      '/materials'),
  SectionNav(AppSection.invoices, 'Invoices', Icons.receipt_long_outlined,
      '/invoices'),
  SectionNav(AppSection.finance, 'Finance', Icons.show_chart_rounded,
      '/finance'),
  SectionNav(AppSection.coach, 'AI Coach', Icons.auto_awesome_outlined,
      '/coach'),
  SectionNav(AppSection.reviews, 'Reviews', Icons.star_outline, '/reviews'),
  SectionNav(AppSection.dashboard, 'Dashboard', Icons.grid_view_rounded,
      '/dashboard'),
  SectionNav(AppSection.team, 'Team', Icons.groups_outlined, '/team'),
  SectionNav(AppSection.settings, 'Settings', Icons.settings_outlined,
      '/settings'),
];

/// Wraps the office surface with an end drawer listing every section the user's
/// role can reach. A drawer rather than a bottom bar, deliberately: the home
/// screen is meant to be a single uncluttered prompt, so navigation stays out of
/// the way until asked for.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ctx = ref.watch(activeContextProvider).valueOrNull;
    if (ctx == null) return child;

    return Scaffold(
      endDrawer: _NavDrawer(ctx: ctx),
      body: child,
    );
  }
}

class _NavDrawer extends ConsumerWidget {
  const _NavDrawer({required this.ctx});

  final ActiveContext ctx;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final allowed = accessibleSections(ctx.role).toSet();
    final items =
        allSections.where((s) => allowed.contains(s.section)).toList();
    final currentRoute = GoRouterState.of(context).uri.path;

    return Drawer(
      backgroundColor: c.background,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const BrandMark(size: 34, showWordmark: true),
                  const SizedBox(height: 16),
                  Text(
                    ctx.companyName,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: c.foreground,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${ctx.memberName} · ${roleLabels[ctx.role]}',
                    style: TextStyle(fontSize: 13, color: c.mutedForeground),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: c.border),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _NavRow(
                    icon: Icons.add_circle_outline,
                    label: 'New estimate',
                    selected: currentRoute == '/',
                    onTap: () {
                      Navigator.of(context).pop();
                      context.go('/');
                    },
                  ),
                  Divider(height: 17, color: c.border, indent: 16, endIndent: 16),
                  ...items.map(
                    (s) => _NavRow(
                      icon: s.icon,
                      label: s.label,
                      selected: currentRoute == s.route,
                      onTap: () {
                        Navigator.of(context).pop();
                        context.go(s.route);
                      },
                    ),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: c.border),
            _NavRow(
              icon: Icons.logout_rounded,
              label: 'Sign out',
              selected: false,
              onTap: () async {
                Navigator.of(context).pop();
                await ref.read(authControllerProvider).signOut();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _NavRow extends StatelessWidget {
  const _NavRow({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 1),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        decoration: BoxDecoration(
          color: selected ? c.primary.withOpacity(0.1) : null,
          borderRadius: BorderRadius.circular(FieldRadius.md),
        ),
        child: Row(
          children: [
            Container(
              height: 30,
              width: 30,
              decoration: BoxDecoration(
                color: selected
                    ? c.primary
                    : c.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(FieldRadius.sm),
              ),
              child: Icon(
                icon,
                size: 17,
                color: selected ? c.primaryForeground : c.primary,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 14.5,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                color: c.foreground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
