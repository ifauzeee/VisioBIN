import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Centralized API service for VisioBin mobile app.
/// Mirrors the web dashboard's `api.js` service layer.
class ApiService {
  // Base URL — sesuaikan dengan backend
  // Untuk emulator Android: 10.0.2.2
  // Untuk device fisik: IP lokal backend
  static const String _defaultBaseUrl = 'http://10.0.2.2:8080/api/v1';

  final String baseUrl;
  String? _token;

  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? _defaultBaseUrl;

  /// Set auth token setelah login
  void setToken(String token) => _token = token;

  /// Clear auth token saat logout
  void clearToken() => _token = null;

  /// Apakah sudah punya token?
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  /// Headers standar dengan auth
  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  // ── Auth ──────────────────────────────────────────────

  /// Login dan dapatkan token JWT
  Future<ApiResponse> login(String username, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );

      final data = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode == 200 && data['success'] == true) {
        final token = data['data']['token'] as String;
        setToken(token);
        return ApiResponse(success: true, data: data['data']);
      }

      return ApiResponse(
        success: false,
        message: data['message'] ?? 'Login gagal',
      );
    } catch (e) {
      debugPrint('[API] Login error: $e');
      return ApiResponse(
        success: false,
        message: 'Tidak dapat terhubung ke server',
      );
    }
  }

  /// Register user baru
  Future<ApiResponse> register({
    required String username,
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'email': email,
          'password': password,
          'full_name': fullName,
        }),
      );

      final data = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode == 201 && data['success'] == true) {
        final token = data['data']['token'] as String;
        setToken(token);
        return ApiResponse(success: true, data: data['data']);
      }

      return ApiResponse(
        success: false,
        message: data['message'] ?? 'Registrasi gagal',
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Tidak dapat terhubung ke server',
      );
    }
  }

  /// Update FCM Token untuk push notifications
  Future<ApiResponse> updateFcmToken(String fcmToken) async {
    return _put('/auth/fcm-token', body: {'fcm_token': fcmToken});
  }

  // ── Dashboard ─────────────────────────────────────────

  /// Ambil summary dashboard (KPIs, charts, alerts)
  Future<ApiResponse> getDashboardSummary() async {
    return _get('/dashboard/summary');
  }

  // ── Bins ──────────────────────────────────────────────

  /// List semua bin
  Future<ApiResponse> listBins() async {
    return _get('/bins');
  }

  /// Detail satu bin
  Future<ApiResponse> getBin(String binId) async {
    return _get('/bins/$binId');
  }

  /// Riwayat sensor sebuah bin
  Future<ApiResponse> getSensorHistory(String binId, {
    String? from,
    String? to,
    int? limit,
  }) async {
    final params = <String, String>{};
    if (from != null) params['from'] = from;
    if (to != null) params['to'] = to;
    if (limit != null) params['limit'] = limit.toString();

    final query = params.isNotEmpty
        ? '?${params.entries.map((e) => '${e.key}=${e.value}').join('&')}'
        : '';
    return _get('/bins/$binId/history$query');
  }

  /// Prediksi pengisian bin
  Future<ApiResponse> getForecast(String binId) async {
    return _get('/bins/$binId/forecast');
  }

  // ── Classifications ───────────────────────────────────

  /// List log klasifikasi AI
  Future<ApiResponse> listClassifications({
    String? binId,
    int? page,
    int? limit,
  }) async {
    final params = <String, String>{};
    if (binId != null) params['bin_id'] = binId;
    if (page != null) params['page'] = page.toString();
    if (limit != null) params['limit'] = limit.toString();

    final query = params.isNotEmpty
        ? '?${params.entries.map((e) => '${e.key}=${e.value}').join('&')}'
        : '';
    return _get('/classifications$query');
  }

  // ── Alerts ────────────────────────────────────────────

  /// List alerts
  Future<ApiResponse> listAlerts({
    int? page,
    int? limit,
    bool unreadOnly = false,
  }) async {
    final params = <String, String>{};
    if (page != null) params['page'] = page.toString();
    if (limit != null) params['limit'] = limit.toString();
    if (unreadOnly) params['unread'] = 'true';

    final query = params.isNotEmpty
        ? '?${params.entries.map((e) => '${e.key}=${e.value}').join('&')}'
        : '';
    return _get('/alerts$query');
  }

  /// Tandai alert sebagai dibaca
  Future<ApiResponse> markAlertRead(int alertId) async {
    return _put('/alerts/$alertId/read');
  }

  // ── Internal HTTP Helpers ─────────────────────────────

  Future<ApiResponse> _get(String endpoint) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
      );

      return _parseResponse(res);
    } catch (e) {
      debugPrint('[API] GET $endpoint error: $e');
      return ApiResponse(
        success: false,
        message: 'Koneksi gagal: $e',
      );
    }
  }

  Future<ApiResponse> _put(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
        body: body != null ? jsonEncode(body) : null,
      );

      return _parseResponse(res);
    } catch (e) {
      debugPrint('[API] PUT $endpoint error: $e');
      return ApiResponse(
        success: false,
        message: 'Koneksi gagal: $e',
      );
    }
  }

  ApiResponse _parseResponse(http.Response res) {
    try {
      final data = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return ApiResponse(
          success: data['success'] ?? true,
          data: data['data'],
          message: data['message'],
        );
      }

      // Handle 401 Unauthorized
      if (res.statusCode == 401) {
        clearToken();
        return ApiResponse(
          success: false,
          message: 'Sesi habis, silakan login ulang',
          statusCode: 401,
        );
      }

      return ApiResponse(
        success: false,
        message: data['message'] ?? 'Error ${res.statusCode}',
        statusCode: res.statusCode,
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Gagal memproses respons server',
      );
    }
  }
}

/// Wrapper untuk API response
class ApiResponse {
  final bool success;
  final dynamic data;
  final String? message;
  final int? statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
  });
}
