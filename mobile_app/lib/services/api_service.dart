import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

/// Centralized API service for VisioBin mobile app.
/// Mirrors the web dashboard's `api.js` service layer.
class ApiService {
  static String get _defaultBaseUrl => AppConfig.apiBaseUrl;

  final String baseUrl;
  String? _token;
  String? _refreshToken;
  Map<String, dynamic>? _user;
  bool _isRefreshing = false;

  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? _defaultBaseUrl;

  /// Set auth token dan user data, simpan ke local storage
  Future<void> setToken(String token, [Map<String, dynamic>? userData, String? refreshToken]) async {
    _token = token;
    _user = userData;
    if (refreshToken != null) _refreshToken = refreshToken;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    if (userData != null) {
      await prefs.setString('user_data', jsonEncode(userData));
    }
    if (refreshToken != null) {
      await prefs.setString('refresh_token', refreshToken);
    }
  }

  /// Clear auth token saat logout dari memory dan local storage
  Future<void> clearToken() async {
    _token = null;
    _refreshToken = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
    await prefs.remove('refresh_token');
  }

  /// Load session dari local storage (Auto-login)
  Future<bool> loadStoredSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final userJson = prefs.getString('user_data');
      final refreshToken = prefs.getString('refresh_token');

      if (token != null && token.isNotEmpty) {
        _token = token;
        _refreshToken = refreshToken;
        if (userJson != null) {
          _user = jsonDecode(userJson);
        }
        return true;
      }
    } catch (e) {
      debugPrint('[API] Load Session Error: $e');
    }
    return false;
  }

  /// Apakah sudah punya token?
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  /// User data saat ini
  Map<String, dynamic>? get currentUser => _user;

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
        final refreshToken = data['data']['refresh_token'] as String?;
        await setToken(token, data['data']['user'], refreshToken);
        return ApiResponse(success: true, data: data['data']);
      }

      if (res.statusCode == 401) {
        return ApiResponse(
          success: false,
          message: 'Username atau password salah.',
          statusCode: 401,
        );
      }

      return ApiResponse(
        success: false,
        message: data['message'] ?? 'Login gagal',
        statusCode: res.statusCode,
      );
    } catch (e) {
      debugPrint('[API] Login Exception: $e');
      debugPrint('[API] Target URL: $baseUrl/auth/login');
      return ApiResponse(
        success: false,
        message:
            'Gagal menghubungkan ke server ($e). Periksa apakah IP $_defaultBaseUrl sudah benar dan laptop Anda mengizinkan koneksi di port 8080.',
      );
    }
  }

  /// Login as guest
  Future<ApiResponse> guestLogin() async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/guest-login'),
        headers: {'Content-Type': 'application/json'},
      );

      final data = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode == 200 && data['success'] == true) {
        final token = data['data']['token'] as String;
        await setToken(token, data['data']['user']);
        return ApiResponse(success: true, data: data['data']);
      }

      return ApiResponse(
        success: false,
        message: data['message'] ?? 'Login tamu gagal',
        statusCode: res.statusCode,
      );
    } catch (e) {
      debugPrint('[API] Guest Login error: $e');
      return ApiResponse(
        success: false,
        message: 'Gagal menghubungkan ke server. Silakan periksa koneksi Anda.',
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
        final refreshToken = data['data']['refresh_token'] as String?;
        await setToken(token, data['data']['user'], refreshToken);
        return ApiResponse(success: true, data: data['data']);
      }

      return ApiResponse(
        success: false,
        message: data['message'] ?? 'Registrasi gagal',
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Gagal menghubungkan ke server. Silakan periksa koneksi Anda.',
      );
    }
  }

  /// Update FCM Token untuk push notifications
  Future<ApiResponse> updateFcmToken(String fcmToken) async {
    return _put('/auth/fcm-token', body: {'fcm_token': fcmToken});
  }

  /// Update profil user
  Future<ApiResponse> updateProfile({
    required String fullName,
    required String email,
    String? password,
  }) async {
    final body = {
      'full_name': fullName,
      'email': email,
      if (password != null && password.isNotEmpty) 'password': password,
    };
    return _put('/auth/profile', body: body);
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
  Future<ApiResponse> getSensorHistory(
    String binId, {
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

  // ── Maintenance ───────────────────────────────────────

  /// List maintenance logs
  Future<ApiResponse> listMaintenanceLogs({
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
    return _get('/maintenance$query');
  }

  /// Create a new maintenance log
  Future<ApiResponse> createMaintenanceLog(Map<String, dynamic> data) async {
    return _post('/maintenance', body: data);
  }

  // ── Chat ──────────────────────────────────────────────

  /// List chat history (General or Private with otherId)
  Future<ApiResponse> getChatHistory({String? otherId, int? limit}) async {
    final params = <String, String>{};
    if (otherId != null && otherId.isNotEmpty) params['other_id'] = otherId;
    if (limit != null) params['limit'] = limit.toString();

    final query = params.isNotEmpty
        ? '?${params.entries.map((e) => '${e.key}=${e.value}').join('&')}'
        : '';
    return _get('/chat/history$query');
  }

  /// Send chat message
  Future<ApiResponse> sendChatMessage(
    String content, {
    String? recipientId,
  }) async {
    final body = {
      'content': content,
      if (recipientId != null && recipientId.isNotEmpty)
        'recipient_id': recipientId,
    };
    return _post('/chat', body: body);
  }

  /// List users for chat member selection
  Future<ApiResponse> listUsers() async {
    return _get('/auth/users');
  }

  // ── Internal HTTP Helpers ─────────────────────────────

  Future<ApiResponse> _get(String endpoint) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('api_cache_$endpoint', res.body);
        } catch (cacheErr) {
          debugPrint('[API] Cache Write Error for $endpoint: $cacheErr');
        }
      }

      return await _parseResponse(res);
    } catch (e) {
      debugPrint('[API] GET $endpoint error: $e. Checking cache...');
      try {
        final prefs = await SharedPreferences.getInstance();
        final cachedData = prefs.getString('api_cache_$endpoint');
        if (cachedData != null) {
          final data = jsonDecode(cachedData) as Map<String, dynamic>;
          debugPrint('[API] Returning offline cached data for $endpoint');
          return ApiResponse(
            success: data['success'] ?? true,
            data: data['data'],
            message: data['message'],
            isCached: true,
          );
        }
      } catch (cacheErr) {
        debugPrint('[API] Cache Read Error for $endpoint: $cacheErr');
      }
      return ApiResponse(
        success: false,
        message: 'Gagal menghubungkan ke server. Silakan periksa koneksi Anda.',
      );
    }
  }

  Future<ApiResponse> _post(
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
        body: body != null ? jsonEncode(body) : null,
      );

      return await _parseResponse(res);
    } catch (e) {
      debugPrint('[API] POST $endpoint error: $e');
      return ApiResponse(
        success: false,
        message: 'Gagal menghubungkan ke server. Silakan periksa koneksi Anda.',
      );
    }
  }

  Future<ApiResponse> _put(
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
        body: body != null ? jsonEncode(body) : null,
      );

      return await _parseResponse(res);
    } catch (e) {
      debugPrint('[API] PUT $endpoint error: $e');
      return ApiResponse(
        success: false,
        message: 'Gagal menghubungkan ke server. Silakan periksa koneksi Anda.',
      );
    }
  }

  Future<ApiResponse> _parseResponse(http.Response res) async {
    try {
      final data = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return ApiResponse(
          success: data['success'] ?? true,
          data: data['data'],
          message: data['message'],
        );
      }

      // Handle 401 Unauthorized — try refresh token
      if (res.statusCode == 401) {
        // Try auto-refresh before giving up
        if (_refreshToken != null && !_isRefreshing) {
          final refreshed = await _tryRefreshToken();
          if (refreshed) {
            return ApiResponse(
              success: false,
              message: 'Token refreshed, please retry',
              statusCode: 401,
            );
          }
        }
        await clearToken();
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

  /// Try to refresh the access token using the stored refresh token
  Future<bool> _tryRefreshToken() async {
    if (_refreshToken == null || _isRefreshing) return false;
    _isRefreshing = true;

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refresh_token': _refreshToken}),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          final newToken = data['data']['token'] as String;
          final newRefreshToken = data['data']['refresh_token'] as String?;
          await setToken(newToken, data['data']['user'], newRefreshToken);
          debugPrint('[API] Token refreshed successfully');
          return true;
        }
      }
    } catch (e) {
      debugPrint('[API] Token refresh failed: $e');
    } finally {
      _isRefreshing = false;
    }
    return false;
  }
}

/// Wrapper untuk API response
class ApiResponse {
  final bool success;
  final dynamic data;
  final String? message;
  final int? statusCode;
  final bool isCached;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
    this.isCached = false,
  });
}
