import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/dashboard_provider.dart';

class AnalyticsChart extends StatelessWidget {
  final DashboardProvider provider;

  const AnalyticsChart({
    super.key,
    required this.provider,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dailyStats = provider.summary.dailyStats;

    return Container(
      height: 300,
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                LucideIcons.activity,
                size: 20,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              const Text(
                'Organic vs Non-Organic',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Expanded(
            child: dailyStats.isEmpty
                ? Center(
                    child: Text(
                      'Belum ada data klasifikasi harian',
                      style: TextStyle(
                        color: isDark ? Colors.white54 : Colors.black54,
                        fontSize: 13,
                      ),
                    ),
                  )
                : BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: _maxDailyStatY(provider),
                      barTouchData: BarTouchData(enabled: false),
                      titlesData: FlTitlesData(
                        show: true,
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              const style = TextStyle(
                                color: Colors.grey,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              );
                              final index = value.toInt();
                              final text = index >= 0 && index < dailyStats.length
                                  ? dailyStats[index].day
                                  : '';
                              return Padding(
                                padding: const EdgeInsets.only(top: 8.0),
                                child: Text(text, style: style),
                              );
                            },
                          ),
                        ),
                        leftTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                      ),
                      gridData: const FlGridData(show: false),
                      borderData: FlBorderData(show: false),
                      barGroups: _buildBarGroups(provider),
                    ),
                  ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegendItem('Organic', const Color(0xFF10b981)),
              const SizedBox(width: 24),
              _buildLegendItem('Non-Organic', const Color(0xFFf59e0b)),
            ],
          ),
        ],
      ),
    );
  }

  List<BarChartGroupData> _buildBarGroups(DashboardProvider provider) {
    return provider.summary.dailyStats.asMap().entries.map((entry) {
      final stat = entry.value;
      return _makeGroupData(
        entry.key,
        stat.organic.toDouble(),
        stat.inorganic.toDouble(),
      );
    }).toList();
  }

  double _maxDailyStatY(DashboardProvider provider) {
    final values = provider.summary.dailyStats
        .expand((stat) => [stat.organic, stat.inorganic])
        .toList();
    if (values.isEmpty) return 1;
    final maxValue = values.reduce((a, b) => a > b ? a : b).toDouble();
    return maxValue <= 0 ? 1 : maxValue * 1.2;
  }

  Widget _buildLegendItem(String title, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  BarChartGroupData _makeGroupData(int x, double y1, double y2) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y1.clamp(0, 100),
          color: const Color(0xFF10b981),
          width: 12,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(6),
            topRight: Radius.circular(6),
          ),
        ),
        BarChartRodData(
          toY: y2.clamp(0, 100),
          color: const Color(0xFFf59e0b),
          width: 12,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(6),
            topRight: Radius.circular(6),
          ),
        ),
      ],
    );
  }
}
