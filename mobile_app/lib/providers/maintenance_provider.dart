import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class MaintenanceProvider extends ChangeNotifier {
  final ApiService _apiService;

  bool _isLoading = false;
  String? _error;
  List<MaintenanceLog> _logs = [];
  List<Bin> _bins = [];

  MaintenanceProvider(this._apiService);

  bool get isLoading => _isLoading;
  String? get error => _error;
  List<MaintenanceLog> get logs => _logs;
  List<Bin> get bins => _bins;

  Future<void> fetchLogs() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.listMaintenanceLogs();
      if (res.success) {
        final List<dynamic> data = res.data ?? [];
        _logs = data.map((json) => MaintenanceLog.fromJson(json)).toList();
      } else {
        _error = res.message;
      }
    } catch (e) {
      _error = 'Gagal mengambil data log perawatan: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchBins() async {
    try {
      final res = await _apiService.listBins();
      if (res.success) {
        final List<dynamic> data = res.data ?? [];
        _bins = data.map((json) => Bin.fromJson(json)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Gagal mengambil data bins: $e");
    }
  }

  Future<bool> createLog(String binId, String actionType, String notes) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await _apiService.createMaintenanceLog({
        'bin_id': binId,
        'action_type': actionType,
        'notes': notes,
      });

      if (res.success) {
        await fetchLogs(); // Refresh data
        return true;
      } else {
        _error = res.message;
        return false;
      }
    } catch (e) {
      _error = 'Gagal menyimpan log perawatan: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
