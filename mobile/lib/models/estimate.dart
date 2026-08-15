/// Wire models for the AI estimate flow, matching the response of
/// `app/api/estimate/extract/route.ts`.
///
/// Money is NEVER computed here. Every line total, subtotal, VAT amount and
/// grand total is recalculated server-side by `computeTotals` in `lib/money.ts`
/// — the app only displays what the server returns. Do not add arithmetic to
/// this file; it would fork the source of truth for money.
library;

enum LineItemKind { labour, material, callOut, other }

LineItemKind lineItemKindFromString(String? value) => switch (value) {
      'labour' => LineItemKind.labour,
      'material' => LineItemKind.material,
      'call_out' => LineItemKind.callOut,
      _ => LineItemKind.other,
    };

String lineItemKindLabel(LineItemKind kind) => switch (kind) {
      LineItemKind.labour => 'Labour',
      LineItemKind.material => 'Material',
      LineItemKind.callOut => 'Call-out',
      LineItemKind.other => 'Other',
    };

class LineItem {
  const LineItem({
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
    required this.kind,
  });

  final String description;
  final double quantity;
  final double unitPrice;
  final double lineTotal;
  final LineItemKind kind;

  factory LineItem.fromJson(Map<String, dynamic> json) => LineItem(
        description: (json['description'] as String?) ?? '',
        quantity: _toDouble(json['quantity']),
        unitPrice: _toDouble(json['unit_price']),
        lineTotal: _toDouble(json['line_total']),
        kind: lineItemKindFromString(json['kind'] as String?),
      );
}

enum AiConfidence { high, medium, low }

AiConfidence? aiConfidenceFromString(String? value) => switch (value) {
      'high' => AiConfidence.high,
      'medium' => AiConfidence.medium,
      'low' => AiConfidence.low,
      _ => null,
    };

/// An AI-extracted estimate, not yet persisted. Saving it to Supabase creates
/// the draft `estimates` row.
class EstimateDraft {
  const EstimateDraft({
    required this.jobTitle,
    required this.summaryForCustomer,
    required this.lineItems,
    required this.subtotal,
    required this.vatRate,
    required this.vatAmount,
    required this.totalIncVat,
    this.estimatedDurationHours,
    this.confidence,
    this.flags = const [],
  });

  final String jobTitle;
  final String summaryForCustomer;
  final List<LineItem> lineItems;
  final double subtotal;
  final double vatRate;
  final double vatAmount;
  final double totalIncVat;
  final double? estimatedDurationHours;
  final AiConfidence? confidence;
  final List<String> flags;

  factory EstimateDraft.fromJson(Map<String, dynamic> json) => EstimateDraft(
        jobTitle: (json['job_title'] as String?) ?? 'Untitled job',
        summaryForCustomer: (json['summary_for_customer'] as String?) ?? '',
        lineItems: ((json['line_items'] as List?) ?? [])
            .map((e) => LineItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        subtotal: _toDouble(json['subtotal']),
        vatRate: _toDouble(json['vat_rate']),
        vatAmount: _toDouble(json['vat_amount']),
        totalIncVat: _toDouble(json['total_inc_vat']),
        estimatedDurationHours: json['estimated_duration_hours'] == null
            ? null
            : _toDouble(json['estimated_duration_hours']),
        confidence: aiConfidenceFromString(json['ai_confidence'] as String?),
        flags: ((json['ai_flags'] as List?) ?? [])
            .map((e) => e.toString())
            .toList(),
      );
}

/// PostgREST returns numerics as num or as String depending on column type
/// (numeric/decimal arrive as String), so coerce defensively.
double _toDouble(dynamic value) => switch (value) {
      null => 0,
      num n => n.toDouble(),
      String s => double.tryParse(s) ?? 0,
      _ => 0,
    };
