import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/dashboard_provider.dart';
import '../l10n/app_localizations.dart';

/// Map screen showing all bin locations on an OpenStreetMap tile layer.
/// Each bin is displayed as a colored marker based on its fill level.
class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  Bin? _selectedBin;

  // Default center (Indonesia)
  static const _defaultCenter = LatLng(-6.2, 106.8);
  static const _defaultZoom = 13.0;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DashboardProvider>();
    final bins = provider.bins;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context)!;

    // Compute center from bins with valid coordinates
    final binsWithCoords = bins.where((b) =>
        b.latitude != null && b.longitude != null &&
        b.latitude != 0 && b.longitude != 0).toList();

    final center = binsWithCoords.isNotEmpty
        ? LatLng(
            binsWithCoords.map((b) => b.latitude!).reduce((a, b) => a + b) / binsWithCoords.length,
            binsWithCoords.map((b) => b.longitude!).reduce((a, b) => a + b) / binsWithCoords.length,
          )
        : _defaultCenter;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(l10n.map, style: const TextStyle(fontWeight: FontWeight.w700)),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        actions: [
          if (binsWithCoords.isNotEmpty)
            IconButton(
              icon: const Icon(LucideIcons.locate),
              tooltip: 'Center Map',
              onPressed: () {
                _mapController.move(center, _defaultZoom);
              },
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
                      setState(() => _selectedBin = null);
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
                    MarkerLayer(
                      markers: binsWithCoords.map((bin) => _buildMarker(bin)).toList(),
                    ),
                  ],
                ),
                // Legend
                Positioned(
                  top: 12,
                  right: 12,
                  child: _buildLegend(isDark),
                ),
                // Selected bin card
                if (_selectedBin != null)
                  Positioned(
                    bottom: 24,
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
