/// Data models mirroring the backend Go models.
/// Matches `backend/internal/models/models.go`.

class DashboardSummary {
  final int totalBins;
  final int activeBins;
  final int binsNearFull;
  final int unreadAlerts;
  final int totalClassificationsToday;
  final int organicCountToday;
  final int inorganicCountToday;
  final List<BinStatusSummary> binStatuses;

  DashboardSummary({
    this.totalBins = 0,
    this.activeBins = 0,
    this.binsNearFull = 0,
    this.unreadAlerts = 0,
    this.totalClassificationsToday = 0,
    this.organicCountToday = 0,
    this.inorganicCountToday = 0,
    this.binStatuses = const [],
  });

  int get totalProcessed => organicCountToday + inorganicCountToday;
  double get co2Reduced => (organicCountToday * 0.05 + inorganicCountToday * 0.02);

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      totalBins: json['total_bins'] ?? 0,
      activeBins: json['active_bins'] ?? 0,
      binsNearFull: json['bins_near_full'] ?? 0,
      unreadAlerts: json['unread_alerts'] ?? 0,
      totalClassificationsToday: json['total_classifications_today'] ?? 0,
      organicCountToday: json['organic_count_today'] ?? 0,
      inorganicCountToday: json['inorganic_count_today'] ?? 0,
      binStatuses: (json['bin_statuses'] as List<dynamic>?)
              ?.map((b) => BinStatusSummary.fromJson(b))
              .toList() ??
          [],
    );
  }
}

class BinStatusSummary {
  final String binId;
  final String binName;
  final String status;
  final double? volumeOrganicPct;
  final double? volumeInorganicPct;
  final double? gasAmoniaPpm;

  BinStatusSummary({
    required this.binId,
    required this.binName,
    required this.status,
    this.volumeOrganicPct,
    this.volumeInorganicPct,
    this.gasAmoniaPpm,
  });

  double get averageVolume =>
      ((volumeOrganicPct ?? 0) + (volumeInorganicPct ?? 0)) / 2;

  factory BinStatusSummary.fromJson(Map<String, dynamic> json) {
    return BinStatusSummary(
      binId: json['bin_id'] ?? '',
      binName: json['bin_name'] ?? '',
      status: json['status'] ?? 'unknown',
      volumeOrganicPct: (json['volume_organic_pct'] as num?)?.toDouble(),
      volumeInorganicPct: (json['volume_inorganic_pct'] as num?)?.toDouble(),
      gasAmoniaPpm: (json['gas_amonia_ppm'] as num?)?.toDouble(),
    );
  }
}

class Bin {
  final String id;
  final String name;
  final String location;
  final double? latitude;
  final double? longitude;
  final double maxVolumeCm;
  final double maxWeightKg;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final SensorReading? latestReading;

  Bin({
    required this.id,
    required this.name,
    required this.location,
    this.latitude,
    this.longitude,
    this.maxVolumeCm = 50.0,
    this.maxWeightKg = 20.0,
    this.status = 'active',
    required this.createdAt,
    required this.updatedAt,
    this.latestReading,
  });

  factory Bin.fromJson(Map<String, dynamic> json) {
    return Bin(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      location: json['location'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      maxVolumeCm: (json['max_volume_cm'] as num?)?.toDouble() ?? 50.0,
      maxWeightKg: (json['max_weight_kg'] as num?)?.toDouble() ?? 20.0,
      status: json['status'] ?? 'active',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated_at'] ?? '') ?? DateTime.now(),
      latestReading: json['latest_reading'] != null
          ? SensorReading.fromJson(json['latest_reading'])
          : null,
    );
  }
}

class SensorReading {
  final int id;
  final String binId;
  final double? distanceOrganicCm;
  final double? distanceInorganicCm;
  final double? weightOrganicKg;
  final double? weightInorganicKg;
  final double? gasAmoniaPpm;
  final double? volumeOrganicPct;
  final double? volumeInorganicPct;
  final DateTime recordedAt;

  SensorReading({
    required this.id,
    required this.binId,
    this.distanceOrganicCm,
    this.distanceInorganicCm,
    this.weightOrganicKg,
    this.weightInorganicKg,
    this.gasAmoniaPpm,
    this.volumeOrganicPct,
    this.volumeInorganicPct,
    required this.recordedAt,
  });

  double get totalWeight =>
      (weightOrganicKg ?? 0) + (weightInorganicKg ?? 0);

  double get averageVolume =>
      ((volumeOrganicPct ?? 0) + (volumeInorganicPct ?? 0)) / 2;

  factory SensorReading.fromJson(Map<String, dynamic> json) {
    return SensorReading(
      id: json['id'] ?? 0,
      binId: json['bin_id'] ?? '',
      distanceOrganicCm: (json['distance_organic_cm'] as num?)?.toDouble(),
      distanceInorganicCm: (json['distance_inorganic_cm'] as num?)?.toDouble(),
      weightOrganicKg: (json['weight_organic_kg'] as num?)?.toDouble(),
      weightInorganicKg: (json['weight_inorganic_kg'] as num?)?.toDouble(),
      gasAmoniaPpm: (json['gas_amonia_ppm'] as num?)?.toDouble(),
      volumeOrganicPct: (json['volume_organic_pct'] as num?)?.toDouble(),
      volumeInorganicPct: (json['volume_inorganic_pct'] as num?)?.toDouble(),
      recordedAt: DateTime.tryParse(json['recorded_at'] ?? '') ?? DateTime.now(),
    );
  }
}

class ClassificationLog {
  final int id;
  final String binId;
  final String predictedClass;
  final double confidence;
  final int inferenceTimeMs;
  final DateTime classifiedAt;

  ClassificationLog({
    required this.id,
    required this.binId,
    required this.predictedClass,
    this.confidence = 0.0,
    this.inferenceTimeMs = 0,
    required this.classifiedAt,
  });

  bool get isOrganic => predictedClass.toLowerCase() == 'organic';

  factory ClassificationLog.fromJson(Map<String, dynamic> json) {
    return ClassificationLog(
      id: json['id'] ?? 0,
      binId: json['bin_id'] ?? '',
      predictedClass: json['predicted_class'] ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      inferenceTimeMs: json['inference_time_ms'] ?? 0,
      classifiedAt: DateTime.tryParse(json['classified_at'] ?? '') ?? DateTime.now(),
    );
  }
}

class Alert {
  final int id;
  final String binId;
  final String alertType;
  final String message;
  final String severity;
  final bool isRead;
  final DateTime createdAt;
  final String? binName;

  Alert({
    required this.id,
    required this.binId,
    required this.alertType,
    required this.message,
    this.severity = 'info',
    this.isRead = false,
    required this.createdAt,
    this.binName,
  });

  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      id: json['id'] ?? 0,
      binId: json['bin_id'] ?? '',
      alertType: json['alert_type'] ?? '',
      message: json['message'] ?? '',
      severity: json['severity'] ?? 'info',
      isRead: json['is_read'] ?? false,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      binName: json['bin_name'],
    );
  }
}

class ForecastResult {
  final String binId;
  final double currentVolumeOrganicPct;
  final double currentVolumeInorganicPct;
  final double fillRateOrganicPerHr;
  final double fillRateInorganicPerHr;
  final double? hoursUntilFullOrganic;
  final double? hoursUntilFullInorganic;

  ForecastResult({
    required this.binId,
    this.currentVolumeOrganicPct = 0,
    this.currentVolumeInorganicPct = 0,
    this.fillRateOrganicPerHr = 0,
    this.fillRateInorganicPerHr = 0,
    this.hoursUntilFullOrganic,
    this.hoursUntilFullInorganic,
  });

  factory ForecastResult.fromJson(Map<String, dynamic> json) {
    return ForecastResult(
      binId: json['bin_id'] ?? '',
      currentVolumeOrganicPct:
          (json['current_volume_organic_pct'] as num?)?.toDouble() ?? 0,
      currentVolumeInorganicPct:
          (json['current_volume_inorganic_pct'] as num?)?.toDouble() ?? 0,
      fillRateOrganicPerHr:
          (json['fill_rate_organic_per_hr'] as num?)?.toDouble() ?? 0,
      fillRateInorganicPerHr:
          (json['fill_rate_inorganic_per_hr'] as num?)?.toDouble() ?? 0,
      hoursUntilFullOrganic:
          (json['hours_until_full_organic'] as num?)?.toDouble(),
      hoursUntilFullInorganic:
          (json['hours_until_full_inorganic'] as num?)?.toDouble(),
    );
  }
}

class AppUser {
  final String id;
  final String username;
  final String email;
  final String fullName;
  final String role;

  AppUser({
    required this.id,
    required this.username,
    required this.email,
    required this.fullName,
    this.role = 'operator',
  });

  bool get isAdmin => role == 'admin';

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? '',
      role: json['role'] ?? 'operator',
    );
  }
}
