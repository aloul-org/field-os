import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../models/estimate.dart';
import '../../theme/tokens.dart';
import '../auth/session_controller.dart';

/// Shows the AI's priced estimate. Every money value here is rendered exactly as
/// the server computed it — see the note in `models/estimate.dart`.
class EstimateDraftScreen extends ConsumerWidget {
  const EstimateDraftScreen({super.key, required this.draft});

  final EstimateDraft draft;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final ctx = ref.watch(activeContextProvider).valueOrNull;
    final money = NumberFormat.currency(
      symbol: ctx?.currencySymbol ?? '£',
      decimalDigits: 2,
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Draft estimate')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text(
            draft.jobTitle,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
              color: c.foreground,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (draft.confidence != null)
                _ConfidenceChip(confidence: draft.confidence!),
              if (draft.confidence != null &&
                  draft.estimatedDurationHours != null)
                const SizedBox(width: 8),
              if (draft.estimatedDurationHours != null)
                _MetaChip(
                  icon: Icons.schedule_rounded,
                  label: '${_trimZeros(draft.estimatedDurationHours!)} hrs',
                ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            draft.summaryForCustomer,
            style: TextStyle(
              fontSize: 15,
              height: 1.5,
              color: c.mutedForeground,
            ),
          ),
          if (draft.flags.isNotEmpty) ...[
            const SizedBox(height: 18),
            _FlagsCard(flags: draft.flags),
          ],
          const SizedBox(height: 24),
          Text(
            'Line items',
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
              color: c.mutedForeground,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: c.card,
              borderRadius: BorderRadius.circular(FieldRadius.lg),
              border: Border.all(color: c.border),
            ),
            child: Column(
              children: [
                for (var i = 0; i < draft.lineItems.length; i++) ...[
                  if (i > 0) Divider(height: 1, color: c.border),
                  _LineItemRow(item: draft.lineItems[i], money: money),
                ],
              ],
            ),
          ),
          const SizedBox(height: 18),
          _TotalsCard(draft: draft, money: money),
          const SizedBox(height: 24),
          const FilledButton(
            // Persisting the draft, picking a customer and sending it are the
            // next slice of work — see mobile/README.md.
            onPressed: null,
            child: Text('Save as draft'),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              'Saving and sending land in the next build.',
              style: TextStyle(fontSize: 12.5, color: c.mutedForeground),
            ),
          ),
        ],
      ),
    );
  }
}

String _trimZeros(double v) =>
    v == v.roundToDouble() ? v.toInt().toString() : v.toString();

class _LineItemRow extends StatelessWidget {
  const _LineItemRow({required this.item, required this.money});

  final LineItem item;
  final NumberFormat money;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.description,
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w500,
                    color: c.cardForeground,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${lineItemKindLabel(item.kind)} · '
                  '${_trimZeros(item.quantity)} × ${money.format(item.unitPrice)}',
                  style: TextStyle(fontSize: 12.5, color: c.mutedForeground),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            money.format(item.lineTotal),
            style: TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w600,
              color: c.cardForeground,
            ),
          ),
        ],
      ),
    );
  }
}

class _TotalsCard extends StatelessWidget {
  const _TotalsCard({required this.draft, required this.money});

  final EstimateDraft draft;
  final NumberFormat money;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final vatPct = (draft.vatRate * 100);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(FieldRadius.lg),
        border: Border.all(color: c.border),
      ),
      child: Column(
        children: [
          _row(context, 'Subtotal', money.format(draft.subtotal)),
          if (draft.vatRate > 0) ...[
            const SizedBox(height: 8),
            _row(context, 'VAT (${_trimZeros(vatPct)}%)',
                money.format(draft.vatAmount)),
          ],
          const SizedBox(height: 12),
          Divider(height: 1, color: c.border),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: c.cardForeground,
                ),
              ),
              Text(
                money.format(draft.totalIncVat),
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                  color: c.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _row(BuildContext context, String label, String value) {
    final c = context.colors;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 14, color: c.mutedForeground)),
        Text(
          value,
          style: TextStyle(fontSize: 14, color: c.cardForeground),
        ),
      ],
    );
  }
}

class _ConfidenceChip extends StatelessWidget {
  const _ConfidenceChip({required this.confidence});

  final AiConfidence confidence;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (color, label) = switch (confidence) {
      AiConfidence.high => (c.success, 'High confidence'),
      AiConfidence.medium => (c.warning, 'Medium confidence'),
      AiConfidence.low => (c.destructive, 'Low confidence'),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(FieldRadius.pill),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: c.muted,
        borderRadius: BorderRadius.circular(FieldRadius.pill),
        border: Border.all(color: c.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: c.mutedForeground),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: c.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}

/// The AI's own caveats — things it wasn't sure about. Surfacing these is the
/// point: the estimator should see what to double-check before sending.
class _FlagsCard extends StatelessWidget {
  const _FlagsCard({required this.flags});

  final List<String> flags;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.warning.withOpacity(0.08),
        borderRadius: BorderRadius.circular(FieldRadius.md),
        border: Border.all(color: c.warning.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.flag_outlined, size: 16, color: c.warning),
              const SizedBox(width: 8),
              Text(
                'Worth checking',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: c.foreground,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...flags.map(
            (f) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '• $f',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: c.mutedForeground,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
