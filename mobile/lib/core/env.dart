import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Runtime configuration, loaded from the bundled `.env` (see pubspec assets).
///
/// Only PUBLIC values belong here — the Supabase URL and anon key are safe to
/// ship because RLS is the real boundary, exactly as on the web. Secret keys
/// (Anthropic, OpenAI, Stripe, Twilio) must never appear in this file: anything
/// bundled into the app can be extracted from the APK/IPA. Those stay
/// server-side behind the Next.js API, which mobile reaches with a user JWT.
class Env {
  static String _require(String key) {
    final value = dotenv.env[key];
    if (value == null || value.isEmpty) {
      throw StateError(
        'Missing $key in mobile/.env — copy .env.example and fill it in.',
      );
    }
    return value;
  }

  static String get supabaseUrl => _require('SUPABASE_URL');
  static String get supabaseAnonKey => _require('SUPABASE_ANON_KEY');

  /// Base URL of the Next.js app, for the AI endpoints mobile can't run itself.
  /// Note: Android emulators reach the host machine on 10.0.2.2, not localhost.
  static String get apiBaseUrl => _require('API_BASE_URL');

  static Future<void> load() => dotenv.load(fileName: '.env');
}
