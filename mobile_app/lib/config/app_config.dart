import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String? _getDotEnvValue(String key) {
    try {
      if (dotenv.isInitialized) {
        return dotenv.env[key];
      }
    } catch (_) {}
    return null;
  }

  static String get apiBaseUrl {
    const dartDefine = String.fromEnvironment('API_BASE_URL');
    return _requiredEnv('API_BASE_URL', dartDefine, _getDotEnvValue('API_BASE_URL'));
  }

  static String get wsBaseUrl {
    const dartDefine = String.fromEnvironment('WS_BASE_URL');
    return _firstNonEmpty(dartDefine, _getDotEnvValue('WS_BASE_URL')) ??
        _deriveWsBaseUrl(apiBaseUrl);
  }

  static String get cameraStreamUrl {
    const dartDefine = String.fromEnvironment('CAMERA_STREAM_URL');
    return _requiredEnv(
      'CAMERA_STREAM_URL',
      dartDefine,
      _getDotEnvValue('CAMERA_STREAM_URL'),
    );
  }

  static String _requiredEnv(String key, String? first, [String? second]) {
    final value = _firstNonEmpty(first, second);
    if (value == null) {
      throw StateError('Missing required environment variable: $key');
    }
    return value;
  }

  static String? _firstNonEmpty(
    String? first, [
    String? second,
    String? third,
  ]) {
    for (final value in [first, second, third]) {
      if (value != null && value.trim().isNotEmpty) return value.trim();
    }
    return null;
  }

  static String _deriveWsBaseUrl(String apiUrl) {
    final wsUrl = apiUrl
        .replaceFirst(RegExp(r'^http'), 'ws')
        .replaceFirst(RegExp(r'/api/v1/?$'), '/ws');
    if (wsUrl == apiUrl) {
      throw StateError('Missing required environment variable: WS_BASE_URL');
    }
    return wsUrl;
  }
}
