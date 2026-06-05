import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../providers/dashboard_provider.dart';
import 'capacity_circle.dart';

class CapacityIndicators extends StatelessWidget {
  final DashboardProvider provider;

  const CapacityIndicators({
    super.key,
    required this.provider,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Use first bin's data if available
    double volOrganic = 0;
    double volInorganic = 0;
    String warningText = '';

    if (provider.summary.binStatuses.isNotEmpty) {
      final firstBin = provider.summary.binStatuses.first;
      volOrganic = (firstBin.volumeOrganicPct ?? 0) / 100;
      volInorganic = (firstBin.volumeInorganicPct ?? 0) / 100;

      if (volInorganic > 0.8) {
        warningText = '${firstBin.binName}: Anorganik perlu dikosongkan!';
      } else if (volOrganic > 0.8) {
        warningText = '${firstBin.binName}: Organik perlu dikosongkan!';
      } else {
        warningText = '${firstBin.binName}: Kapasitas normal ✓';
      }
    } else {
      warningText = 'Belum ada data bin tersedia';
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              CapacityCircle(
                title: 'Organic',
                percentage: volOrganic.clamp(0.0, 1.0),
                color: const Color(0xFF10b981),
                isDark: isDark,
              ),
              Container(
                height: 80,
                width: 1,
                color: isDark ? Colors.white12 : Colors.grey[200],
              ),
              CapacityCircle(
                title: 'Non-Organic',
                percentage: volInorganic.clamp(0.0, 1.0),
                color: const Color(0xFFf59e0b),
                isDark: isDark,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: (volOrganic > 0.8 || volInorganic > 0.8)
                  ? const Color(0xFFf59e0b).withValues(alpha: 0.1)
                  : const Color(0xFF10b981).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: (volOrganic > 0.8 || volInorganic > 0.8)
                    ? const Color(0xFFf59e0b).withValues(alpha: 0.2)
                    : const Color(0xFF10b981).withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  (volOrganic > 0.8 || volInorganic > 0.8)
                      ? LucideIcons.alertTriangle
                      : LucideIcons.checkCircle,
                  color: (volOrganic > 0.8 || volInorganic > 0.8)
                      ? const Color(0xFFf59e0b)
                      : const Color(0xFF10b981),
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    warningText,
                    style: TextStyle(
                      color: isDark ? Colors.white70 : Colors.black87,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
