import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';

/// State management provider for VisioBin dashboard data.
/// Uses ChangeNotifier pattern for simplicity (can migrate to Riverpod later).
class DashboardProvider extends ChangeNotifier {
  final ApiService _api;

  DashboardProvider(this._api);

  // ── Auth State ──────────────────────────────────────────
  bool _isAuthenticated = false;
  bool _isLoggingIn = false;
  String? _loginError;
  AppUser? _currentUser;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoggingIn => _isLoggingIn;
  String? get loginError => _loginError;
  AppUser? get currentUser => _currentUser;

  // ── Dashboard State ─────────────────────────────────────
  DashboardSummary _summary = DashboardSummary();
  List<Bin> _bins = [];
  List<ClassificationLog> _recentClassifications = [];
  List<Alert> _alerts = [];
  bool _isLoading = true;
  String? _error;
  DateTime? _lastUpdated;

  DashboardSummary get summary => _summary;
  List<Bin> get bins => _bins;
  List<ClassificationLog> get recentClassifications => _recentClassifications;
  List<Alert> get alerts => _alerts;
  bool get isLoading => _isLoading;
  String? get error => _error;
  DateTime? get lastUpdated => _lastUpdated;

  // ── Computed Values ─────────────────────────────────────
  int get unreadAlertCount => _alerts.where((a) => !a.isRead).length;

  double get averageAccuracy {
    if (_recentClassifications.isEmpty) return 97.8;
    final total = _recentClassifications.fold<double>(
        0.0, (acc, c) => acc + c.confidence);
    return (total / _recentClassifications.length) * 100;
  }

  int get averageInferenceMs {
    if (_recentClassifications.isEmpty) return 14;
    final total = _recentClassifications.fold<int>(
        0, (acc, c) => acc + c.inferenceTimeMs);
    return total ~/ _recentClassifications.length;
  }

  // ── Auth Actions ────────────────────────────────────────

  Future<bool> login(String username, String password) async {
    _isLoggingIn = true;
    _loginError = null;
    notifyListeners();

    final res = await _api.login(username, password);

    if (res.success) {
      final userData = res.data as Map<String, dynamic>;
      _currentUser = AppUser.fromJson(userData['user']);
      _isAuthenticated = true;
      _loginError = null;

      // Start loading dashboard data
      fetchAllData();
    } else {
      _loginError = res.message ?? 'Login gagal';
      _isAuthenticated = false;
    }

    _isLoggingIn = false;
    notifyListeners();
    return res.success;
  }

  Future<bool> loginAsGuest() async {
    _isLoggingIn = true;
    _loginError = null;
    notifyListeners();

    final res = await _api.guestLogin();

    if (res.success) {
      final userData = res.data as Map<String, dynamic>;
      _currentUser = AppUser.fromJson(userData['user']);
      _isAuthenticated = true;
      _loginError = null;

      // Start loading dashboard data
      fetchAllData();
    } else {
      _loginError = res.message ?? 'Login tamu gagal';
      _isAuthenticated = false;
    }

    _isLoggingIn = false;
    notifyListeners();
    return res.success;
  }

  void logout() {
    _api.clearToken();
    _isAuthenticated = false;
    _currentUser = null;
    _summary = DashboardSummary();
    _bins = [];
    _recentClassifications = [];
    _alerts = [];
    _lastUpdated = null;
    notifyListeners();
  }

  Future<ApiResponse> updateProfile({
    required String fullName,
    required String email,
    String? password,
  }) async {
    final res = await _api.updateProfile(
      fullName: fullName,
      email: email,
      password: password,
    );

    if (res.success && res.data != null) {
      _currentUser = AppUser.fromJson(res.data);
      notifyListeners();
    }

    return res;
  }

  // ── Data Fetching ───────────────────────────────────────

  /// Fetch all dashboard data at once
  Future<void> fetchAllData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Fire all requests in parallel
      final results = await Future.wait([
        _api.getDashboardSummary(),
        _api.listBins(),
        _api.listClassifications(limit: 10),
        _api.listAlerts(limit: 20),
      ]);

      // Dashboard summary
      final summaryRes = results[0];
      if (summaryRes.success && summaryRes.data != null) {
        _summary = DashboardSummary.fromJson(summaryRes.data);
      }

      // Bins list
      final binsRes = results[1];
      if (binsRes.success && binsRes.data != null) {
        _bins = (binsRes.data as List<dynamic>)
            .map((b) => Bin.fromJson(b))
            .toList();
      }

      // Recent classifications
      final clsRes = results[2];
      if (clsRes.success && clsRes.data != null) {
        _recentClassifications = (clsRes.data as List<dynamic>)
            .map((c) => ClassificationLog.fromJson(c))
            .toList();
      }

      // Alerts
      final alertsRes = results[3];
      if (alertsRes.success && alertsRes.data != null) {
        _alerts = (alertsRes.data as List<dynamic>)
            .map((a) => Alert.fromJson(a))
            .toList();
      }

      _lastUpdated = DateTime.now();
      _error = null;
    } catch (e) {
      debugPrint('[Provider] Fetch error: $e');
      _error = 'Gagal memuat data: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Refresh only dashboard summary (lightweight)
  Future<void> refreshSummary() async {
    final res = await _api.getDashboardSummary();
    if (res.success && res.data != null) {
      _summary = DashboardSummary.fromJson(res.data);
      _lastUpdated = DateTime.now();
      notifyListeners();
    }
  }

  /// Mark an alert as read
  Future<void> markAlertRead(int alertId) async {
    final res = await _api.markAlertRead(alertId);
    if (res.success) {
      final idx = _alerts.indexWhere((a) => a.id == alertId);
      if (idx != -1) {
        // Create updated alert with isRead = true
        final old = _alerts[idx];
        _alerts[idx] = Alert(
          id: old.id,
          binId: old.binId,
          alertType: old.alertType,
          message: old.message,
          severity: old.severity,
          isRead: true,
          createdAt: old.createdAt,
          binName: old.binName,
        );
        notifyListeners();
      }
    }
  }
}
