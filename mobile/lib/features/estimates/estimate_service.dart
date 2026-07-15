import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../models/estimate.dart';

/// An image to send with an extraction request. The API accepts at most 4.
class EstimateImage {
  const EstimateImage({required this.bytes, required this.mediaType});

  final Uint8List bytes;
  final String mediaType;

  Map<String, dynamic> toJson() => {
        'data': base64Encode(bytes),
        'mediaType': mediaType,
      };
}

/// Drives the AI estimate engine. The heavy lifting (Claude/GPT call, historical
/// pricing anchors, server-side money recomputation) all happens in the Next.js
/// route — this just carries the request and parses the reply.
class EstimateService {
  const EstimateService(this._api);

  final ApiClient _api;

  static const maxImages = 4;

  /// Extracts a draft estimate from a description and/or photos.
  ///
  /// Throws [ApiException] with user-presentable copy on failure. At least one
  /// of [description] or [images] must be non-empty (the server enforces this
  /// too, but failing here avoids a pointless round-trip).
  Future<EstimateDraft> extract({
    String? description,
    List<EstimateImage> images = const [],
    String? customerId,
    String? leadId,
  }) async {
    final hasText = description != null && description.trim().isNotEmpty;
    if (!hasText && images.isEmpty) {
      throw ApiException('Describe the job or add a photo.');
    }
    if (images.length > maxImages) {
      throw ApiException('Add up to $maxImages photos.');
    }

    final data = await _api.post('/api/estimate/extract', {
      if (hasText) 'description': description.trim(),
      if (images.isNotEmpty)
        'images': images.map((i) => i.toJson()).toList(),
      if (customerId != null) 'customer_id': customerId,
      if (leadId != null) 'lead_id': leadId,
    });

    return EstimateDraft.fromJson(data);
  }
}

final estimateServiceProvider =
    Provider((ref) => const EstimateService(ApiClient()));
