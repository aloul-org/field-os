import 'dart:convert';

import 'package:http/http.dart' as http;

import 'env.dart';
import 'supabase.dart';

/// Raised when a Next.js API call fails. [message] is already user-presentable —
/// the API's error envelope carries human-readable copy.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.details});

  final String message;
  final int? statusCode;
  final Map<String, dynamic>? details;

  bool get isAuthError => statusCode == 401 || statusCode == 403;

  @override
  String toString() => message;
}

/// Calls the Next.js API for work mobile can't do itself — anything needing a
/// server-held provider key (estimate extraction, coach, copilot, PDFs).
///
/// Authenticates with the user's Supabase JWT as `Authorization: Bearer`, which
/// `getRouteContext(section, request)` on the server accepts alongside its
/// normal cookie flow. Plain CRUD does NOT belong here — that goes straight to
/// Supabase, where RLS already applies.
class ApiClient {
  const ApiClient({http.Client? client}) : _client = client;

  final http.Client? _client;

  http.Client get _http => _client ?? _shared;
  static final _shared = http.Client();

  /// POSTs [body] to [path] and unwraps the API's `{ ok, data }` envelope.
  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    Duration timeout = const Duration(seconds: 90),
  }) async {
    final token = accessToken;
    if (token == null) {
      throw ApiException('You are signed out. Sign in and try again.',
          statusCode: 401);
    }

    final http.Response response;
    try {
      response = await _http
          .post(
            Uri.parse('${Env.apiBaseUrl}$path'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode(body),
          )
          // AI extraction is slow (the route allows 60s), so the default client
          // timeout is far too tight — but it must still be bounded.
          .timeout(timeout);
    } catch (e) {
      throw ApiException(
        "Couldn't reach the server. Check your connection and try again.",
        details: {'cause': e.toString()},
      );
    }

    Map<String, dynamic> json;
    try {
      json = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException(
        'The server returned an unexpected response.',
        statusCode: response.statusCode,
      );
    }

    if (json['ok'] == true) {
      return json['data'] as Map<String, dynamic>;
    }

    throw ApiException(
      (json['error'] as String?) ?? 'Something went wrong.',
      statusCode: response.statusCode,
      details: json['details'] is Map
          ? Map<String, dynamic>.from(json['details'] as Map)
          : null,
    );
  }
}
