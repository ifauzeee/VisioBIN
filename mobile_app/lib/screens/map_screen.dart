import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/dashboard_provider.dart';
import '../l10n/app_localizations.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class Cluster {
  final List<Bin> bins;
  double latitude;
  double longitude;

  Cluster({
    required this.bins,
    required this.latitude,
    required this.longitude,
  });
}

class PulsingUserLocationDot extends StatefulWidget {
  const PulsingUserLocationDot({super.key});

  @override
  State<PulsingUserLocationDot> createState() => _PulsingUserLocationDotState();
}

class _PulsingUserLocationDotState extends State<PulsingUserLocationDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 14 + (18 * _controller.value),
              height: 14 + (18 * _controller.value),
              decoration: BoxDecoration(
                color: const Color(0xFF3b82f6).withOpacity(1.0 - _controller.value),
                shape: BoxShape.circle,
              ),
            ),
            Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: const Color(0xFF3b82f6),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF3b82f6).withOpacity(0.5),
                    blurRadius: 6,
                    spreadRadius: 2,
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  Bin? _selectedBin;
  double _currentZoom = _defaultZoom;
  LatLng? _userLocation;
  List<LatLng>? _navigationRoute;

  static const _defaultCenter = LatLng(-6.2, 106.8);
  static const _defaultZoom = 13.0;

  double _getGridSize(double zoom) {
    if (zoom >= 16.0) return 0.0;
    if (zoom >= 15.0) return 0.002;
    if (zoom >= 14.0) return 0.004;
    if (zoom >= 13.0) return 0.008;
    if (zoom >= 12.0) return 0.016;
    return 0.032;
  }

  Marker _buildClusterMarker(Cluster cluster) {
    final avgVolume = cluster.bins.map((b) => b.latestReading?.averageVolume ?? 0).reduce((a, b) => a + b) ~/ cluster.bins.length;
    final color = _getVolumeColor(avgVolume.toDouble());
    final count = cluster.bins.length;

    return Marker(
      point: LatLng(cluster.latitude, cluster.longitude),
      width: 48,
      height: 48,
      child: GestureDetector(
        onTap: () {
          final newZoom = (_currentZoom + 2.0).clamp(1.0, 18.0);
          _mapController.move(LatLng(cluster.latitude, cluster.longitude), newZoom);
        },
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            shape: BoxShape.circle,
            border: Border.all(
              color: color,
              width: 3,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$count',
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                ),
              ),
              Text(
                '$avgVolume%',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 8,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DashboardProvider>();
    final bins = provider.bins;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context)!;

    final binsWithCoords = bins.where((b) =>
        b.latitude != null && b.longitude != null &&
        b.latitude != 0 && b.longitude != 0).toList();

    final center = binsWithCoords.isNotEmpty
        ? LatLng(
            binsWithCoords.map((b) => b.latitude!).reduce((a, b) => a + b) / binsWithCoords.length,
            binsWithCoords.map((b) => b.longitude!).reduce((a, b) => a + b) / binsWithCoords.length,
          )
        : _defaultCenter;

    if (_userLocation == null && binsWithCoords.isNotEmpty) {
      _userLocation = LatLng(center.latitude + 0.003, center.longitude + 0.003);
    }

    final double gridSize = _getGridSize(_currentZoom);
    final List<Marker> mapMarkers = [];

    if (gridSize == 0.0) {
      mapMarkers.addAll(binsWithCoords.map((bin) => _buildMarker(bin)));
    } else {
      final List<Cluster> clusters = [];
      for (final bin in binsWithCoords) {
        Cluster? foundCluster;
        for (final cluster in clusters) {
          final latDiff = (cluster.latitude - bin.latitude!).abs();
          final lngDiff = (cluster.longitude - bin.longitude!).abs();
          if (latDiff < gridSize && lngDiff < gridSize) {
            foundCluster = cluster;
            break;
          }
        }

        if (foundCluster != null) {
          foundCluster.bins.add(bin);
          foundCluster.latitude = foundCluster.bins.map((b) => b.latitude!).reduce((a, b) => a + b) / foundCluster.bins.length;
          foundCluster.longitude = foundCluster.bins.map((b) => b.longitude!).reduce((a, b) => a + b) / foundCluster.bins.length;
        } else {
          clusters.add(Cluster(
            bins: [bin],
            latitude: bin.latitude!,
            longitude: bin.longitude!,
          ));
        }
      }

      for (final cluster in clusters) {
        if (cluster.bins.length == 1) {
          mapMarkers.add(_buildMarker(cluster.bins[0]));
        } else {
          mapMarkers.add(_buildClusterMarker(cluster));
        }
      }
    }

    if (_userLocation != null) {
      mapMarkers.add(
        Marker(
          point: _userLocation!,
          width: 32,
          height: 32,
          child: Semantics(
            label: 'Lokasi Anda saat ini',
            child: const PulsingUserLocationDot(),
          ),
        ),
      );
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(l10n.map, style: const TextStyle(fontWeight: FontWeight.w700)),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        actions: [
          if (binsWithCoords.isNotEmpty)
            Semantics(
              button: true,
              label: 'Pusatkan Peta ke Lokasi Tempat Sampah',
              child: IconButton(
                icon: const Icon(LucideIcons.locate),
                tooltip: 'Pusatkan Peta',
                onPressed: () {
                  _mapController.move(center, _defaultZoom);
                },
              ),
            ),
        ],
      ),
      body: binsWithCoords.isEmpty
          ? _buildEmptyState(isDark)
          : Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: center,
                    initialZoom: _defaultZoom,
                    onTap: (_, __) {
                      setState(() {
                        _selectedBin = null;
                        _navigationRoute = null;
                      });
                    },
                    onPositionChanged: (position, hasGesture) {
                      if (position.zoom != _currentZoom) {
                        setState(() {
                          _currentZoom = position.zoom;
                        });
                      }
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: isDark
                          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                          : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      subdomains: isDark ? const ['a', 'b', 'c', 'd'] : const [],
                      userAgentPackageName: 'com.visiobin.app',
                    ),
                    if (_navigationRoute != null)
                      PolylineLayer(
                        polylines: [
                          Polyline(
                            points: _navigationRoute!,
                            strokeWidth: 4.5,
                            color: const Color(0xFF3b82f6),
                          ),
                        ],
                      ),
                    MarkerLayer(
                      markers: mapMarkers,
                    ),
                  ],
                ),
                Positioned(
                  top: MediaQuery.of(context).padding.top + kToolbarHeight + 12,
                  right: 12,
                  child: _buildLegend(isDark),
                ),
                if (_selectedBin != null)
                  Positioned(
                    bottom: MediaQuery.of(context).padding.bottom + 16,
                    left: 16,
                    right: 16,
                    child: _buildBinCard(_selectedBin!, isDark),
                  ),
              ],
            ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.mapPin, size: 64, color: isDark ? Colors.white24 : Colors.black26),
          const SizedBox(height: 16),
          Text(
            'Belum ada bin dengan koordinat',
            style: TextStyle(
              fontSize: 16,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tambahkan latitude & longitude pada bin\nuntuk menampilkan di peta.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.white38 : Colors.black38,
            ),
          ),
        ],
      ),
    );
  }

  Marker _buildMarker(Bin bin) {
    final volume = bin.latestReading?.averageVolume ?? 0;
    final color = _getVolumeColor(volume);
    final isSelected = _selectedBin?.id == bin.id;

    return Marker(
      point: LatLng(bin.latitude!, bin.longitude!),
      width: isSelected ? 56 : 44,
      height: isSelected ? 56 : 44,
      child: Semantics(
        button: true,
        label: 'Stasiun Bin: ${bin.name}, Kapasitas ${volume.toStringAsFixed(0)} persen',
        child: Tooltip(
          message: bin.name,
          child: GestureDetector(
            onTap: () => setState(() => _selectedBin = bin),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? Colors.white : Colors.white70,
                  width: isSelected ? 3.5 : 2.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: color.withOpacity(0.5),
                    blurRadius: isSelected ? 16 : 8,
                    spreadRadius: isSelected ? 2 : 0,
                  ),
                ],
              ),
              child: Center(
                child: Icon(
                  LucideIcons.trash2,
                  color: Colors.white,
                  size: isSelected ? 22 : 18,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBinCard(Bin bin, bool isDark) {
    final volume = bin.latestReading?.averageVolume ?? 0;
    final gas = bin.latestReading?.gasAmoniaPpm ?? 0;
    final weight = bin.latestReading?.totalWeight ?? 0;
    final color = _getVolumeColor(volume);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(LucideIcons.trash2, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bin.name,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      bin.location,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white54 : Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: bin.status == 'active'
                      ? const Color(0xFF10B981).withOpacity(0.15)
                      : Colors.red.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  bin.status == 'active' ? 'Online' : 'Offline',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: bin.status == 'active'
                        ? const Color(0xFF10B981)
                        : Colors.redAccent,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildStat(
                icon: LucideIcons.gauge,
                label: 'Volume',
                value: '${volume.toStringAsFixed(0)}%',
                color: color,
                isDark: isDark,
              ),
              _buildStat(
                icon: LucideIcons.wind,
                label: 'Gas',
                value: '${gas.toStringAsFixed(1)} ppm',
                color: gas > 25 ? Colors.orange : const Color(0xFF10B981),
                isDark: isDark,
              ),
              _buildStat(
                icon: LucideIcons.scale,
                label: 'Berat',
                value: '${weight.toStringAsFixed(1)} kg',
                color: const Color(0xFF6366F1),
                isDark: isDark,
              ),
            ],
          ),
          if (_userLocation != null && bin.latitude != null && bin.longitude != null) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: Semantics(
                button: true,
                label: 'Mulai Navigasi Rute ke Stasiun ${bin.name}',
                child: FilledButton.icon(
                  onPressed: () {
                    final p1 = _userLocation!;
                    final p2 = LatLng(bin.latitude!, bin.longitude!);
                    final midLat = (p1.latitude + p2.latitude) / 2;
                    final midLng = (p1.longitude + p2.longitude) / 2;
                    
                    final route = [
                      p1,
                      LatLng(p1.latitude, midLng),
                      LatLng(midLat, midLng),
                      LatLng(midLat, p2.longitude),
                      p2,
                    ];
                    
                    setState(() {
                      _navigationRoute = route;
                    });

                    _mapController.fitCamera(
                      CameraFit.bounds(
                        bounds: LatLngBounds.fromPoints(route),
                        padding: const EdgeInsets.all(50),
                      ),
                    );
                  },
                  icon: const Icon(LucideIcons.navigation, size: 16),
                  label: const Text('Mulai Navigasi'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF3b82f6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStat({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    required bool isDark,
  }) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: isDark ? Colors.white : Colors.black87,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegend(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: (isDark ? const Color(0xFF1E293B) : Colors.white).withOpacity(0.92),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _legendItem(const Color(0xFF10B981), '< 60%', isDark),
          const SizedBox(height: 4),
          _legendItem(const Color(0xFFF59E0B), '60-80%', isDark),
          const SizedBox(height: 4),
          _legendItem(const Color(0xFFEF4444), '> 80%', isDark),
        ],
      ),
    );
  }

  Widget _legendItem(Color color, String text, bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12, height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(text, style: TextStyle(fontSize: 11, color: isDark ? Colors.white70 : Colors.black54)),
      ],
    );
  }

  Color _getVolumeColor(double volume) {
    if (volume >= 80) return const Color(0xFFEF4444);
    if (volume >= 60) return const Color(0xFFF59E0B);
    return const Color(0xFF10B981);
  }
}
