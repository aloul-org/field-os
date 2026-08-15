import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/supabase.dart';
import '../../theme/app_theme.dart';
import '../../theme/tokens.dart';
import '../auth/session_controller.dart';

/// Today's appointments for the signed-in technician, read straight from
/// Supabase (RLS scopes it to their company). Mirrors `/tech/today` on the web.
final todayAppointmentsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final ctx = await ref.watch(activeContextProvider.future);
  if (ctx == null) return [];

  final now = DateTime.now();
  final start = DateTime(now.year, now.month, now.day);
  final end = start.add(const Duration(days: 1));

  final rows = await supabase
      .from('appointments')
      .select('*, jobs(title, address, status)')
      .eq('assigned_technician_id', ctx.member['id'] as String)
      .gte('scheduled_start', start.toIso8601String())
      .lt('scheduled_start', end.toIso8601String())
      // route_order is set by the route optimiser; fall back to time order.
      .order('route_order', ascending: true, nullsFirst: false)
      .order('scheduled_start', ascending: true);

  return List<Map<String, dynamic>>.from(rows);
});

/// The field surface. Always ink-900 regardless of system theme — same call the
/// web app makes for `/tech`, because these screens get used outdoors in glare.
class TechTodayScreen extends ConsumerWidget {
  const TechTodayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Theme(
      data: darkTheme,
      child: Builder(builder: (context) => const _TechTodayBody()),
    );
  }
}

class _TechTodayBody extends ConsumerWidget {
  const _TechTodayBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final ctx = ref.watch(activeContextProvider).valueOrNull;
    final appointments = ref.watch(todayAppointmentsProvider);

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.background,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Today'),
            Text(
              DateFormat('EEEE d MMMM').format(DateTime.now()),
              style: TextStyle(fontSize: 12.5, color: c.mutedForeground),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.logout_rounded, color: c.mutedForeground),
            tooltip: 'Sign out',
            onPressed: () => ref.read(authControllerProvider).signOut(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(todayAppointmentsProvider),
        child: appointments.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const _Message(
            title: "Couldn't load today's jobs",
            body: 'Pull down to try again.',
          ),
          data: (rows) {
            if (rows.isEmpty) {
              return _Message(
                title: ctx == null
                    ? 'Nothing scheduled'
                    : 'Nothing scheduled today',
                body: 'New jobs will appear here as they\'re assigned.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: rows.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _AppointmentCard(row: rows[i]),
            );
          },
        ),
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  const _AppointmentCard({required this.row});

  final Map<String, dynamic> row;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    // Embedded selects arrive as a nested map; the web app has the same shape.
    final job = row['jobs'] as Map<String, dynamic>?;
    final start = DateTime.tryParse(row['scheduled_start'] as String? ?? '');
    final end = DateTime.tryParse(row['scheduled_end'] as String? ?? '');
    final time = start == null
        ? ''
        : '${DateFormat.Hm().format(start.toLocal())}'
            '${end == null ? '' : ' – ${DateFormat.Hm().format(end.toLocal())}'}';

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(FieldRadius.lg),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                time,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: c.primary,
                ),
              ),
              const Spacer(),
              _StatusPill(status: row['status'] as String? ?? 'scheduled'),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            (job?['title'] as String?) ?? 'Job',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: c.cardForeground,
            ),
          ),
          if (job?['address'] != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.place_outlined, size: 14, color: c.mutedForeground),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    job!['address'] as String,
                    style: TextStyle(fontSize: 13, color: c.mutedForeground),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (color, label) = switch (status) {
      'en_route' => (c.warning, 'En route'),
      'in_progress' => (c.primary, 'In progress'),
      'complete' => (c.success, 'Complete'),
      'cancelled' => (c.destructive, 'Cancelled'),
      _ => (c.mutedForeground, 'Scheduled'),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.14),
        borderRadius: BorderRadius.circular(FieldRadius.pill),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11.5,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    // Must scroll for RefreshIndicator to accept a pull gesture.
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.25),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: c.foreground,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  body,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: c.mutedForeground),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
