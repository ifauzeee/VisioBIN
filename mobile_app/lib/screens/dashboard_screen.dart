import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:fl_chart/fl_chart.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.all(24.0),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _buildHeader(context),
                  const SizedBox(height: 32),
                  _buildStatusCards(isDark),
                  const SizedBox(height: 32),
                  Text(
                    'System Status',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _buildSystemStatus(isDark),
                  const SizedBox(height: 32),
                  Text(
                    'Real-time Capacity',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _buildCapacityIndicators(context, isDark),
                  const SizedBox(height: 32),
                  Text(
                    'Weekly Scan Analytics',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _buildAnalyticsChart(context, isDark),
                  const SizedBox(height: 32),
                  Text(
                    'Quick Actions',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _buildQuickActions(context, isDark),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Recent Activity',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text('View All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildRecentActivityList(isDark),
                  const SizedBox(height: 100), // padding for bottom nav
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dashboard',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'VisioBin Analytics Overview',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(
            LucideIcons.bell,
            color: Theme.of(context).colorScheme.onPrimaryContainer,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusCards(bool isDark) {
    return Row(
      children: [
        Expanded(
          child: _StatusCard(
            title: 'Total Scans',
            value: '1,248',
            trend: '+12% this week',
            icon: LucideIcons.scanLine,
            color: const Color(0xFF8b5cf6),
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatusCard(
            title: 'Avg. Accuracy',
            value: '98.5%',
            trend: 'Stable',
            icon: LucideIcons.target,
            color: const Color(0xFF10b981),
            isDark: isDark,
          ),
        ),
      ],
    );
  }

  Widget _buildCapacityIndicators(BuildContext context, bool isDark) {
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
              _CapacityCircle(
                title: 'Organic',
                percentage: 0.65,
                color: const Color(0xFF10b981),
                isDark: isDark,
              ),
              Container(
                height: 80,
                width: 1,
                color: isDark ? Colors.white12 : Colors.grey[200],
              ),
              _CapacityCircle(
                title: 'Non-Organic',
                percentage: 0.82,
                color: const Color(0xFFf59e0b),
                isDark: isDark,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFf59e0b).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFFf59e0b).withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.alertTriangle, 
                  color: Color(0xFFf59e0b), 
                  size: 20
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Non-Organic bin needs emptying today.',
                    style: TextStyle(
                      color: isDark ? Colors.orange[200] : Colors.orange[800],
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

  Widget _buildAnalyticsChart(BuildContext context, bool isDark) {
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
              Icon(LucideIcons.activity, size: 20, color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 8),
              const Text(
                'Organic vs Non-Organic',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Expanded(
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: 100,
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
                        String text;
                        switch (value.toInt()) {
                          case 0: text = 'Mon'; break;
                          case 1: text = 'Tue'; break;
                          case 2: text = 'Wed'; break;
                          case 3: text = 'Thu'; break;
                          case 4: text = 'Fri'; break;
                          case 5: text = 'Sat'; break;
                          case 6: text = 'Sun'; break;
                          default: text = ''; break;
                        }
                        return Padding(padding: const EdgeInsets.only(top: 8.0), child: Text(text, style: style));
                      },
                    ),
                  ),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: const FlGridData(show: false),
                borderData: FlBorderData(show: false),
                barGroups: [
                  _makeGroupData(0, 45, 30),
                  _makeGroupData(1, 60, 40),
                  _makeGroupData(2, 55, 35),
                  _makeGroupData(3, 70, 50),
                  _makeGroupData(4, 85, 60),
                  _makeGroupData(5, 40, 25),
                  _makeGroupData(6, 50, 45),
                ],
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
          )
        ],
      ),
    );
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
        Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey)),
      ],
    );
  }

  BarChartGroupData _makeGroupData(int x, double y1, double y2) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y1,
          color: const Color(0xFF10b981),
          width: 12,
          borderRadius: const BorderRadius.only(topLeft: Radius.circular(6), topRight: Radius.circular(6)),
        ),
        BarChartRodData(
          toY: y2,
          color: const Color(0xFFf59e0b),
          width: 12,
          borderRadius: const BorderRadius.only(topLeft: Radius.circular(6), topRight: Radius.circular(6)),
        ),
      ],
    );
  }

  Widget _buildRecentActivityList(bool isDark) {
    final activities = [
      {'item': 'Plastic Bottle', 'type': 'Non-Organic', 'time': '2 mins ago', 'color': const Color(0xFFf59e0b)},
      {'item': 'Banana Peel', 'type': 'Organic', 'time': '15 mins ago', 'color': const Color(0xFF10b981)},
      {'item': 'Cardboard Box', 'type': 'Non-Organic', 'time': '1 hour ago', 'color': const Color(0xFFf59e0b)},
    ];

    return Column(
      children: activities.map((activity) {
        final color = activity['color'] as Color;
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1F2937) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  activity['type'] == 'Organic' ? LucideIcons.leaf : LucideIcons.packageOpen,
                  color: color,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity['item'] as String,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      activity['type'] as String,
                      style: TextStyle(
                        color: color,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                activity['time'] as String,
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
  Widget _buildSystemStatus(bool isDark) {
    return Row(
      children: [
        Expanded(
          child: _StatusCard(
            title: 'Battery',
            value: '84%',
            trend: 'Charging',
            icon: LucideIcons.batteryCharging,
            color: const Color(0xFF3b82f6),
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _StatusCard(
            title: 'Temperature',
            value: '28°C',
            trend: 'Normal',
            icon: LucideIcons.thermometer,
            color: const Color(0xFFef4444),
            isDark: isDark,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context, bool isDark) {
    return Row(
      children: [
        _buildActionBtn(context, 'Empty Bin', LucideIcons.trash2, const Color(0xFFef4444), isDark),
        const SizedBox(width: 16),
        _buildActionBtn(context, 'Calibrate', LucideIcons.settings2, const Color(0xFF3b82f6), isDark),
        const SizedBox(width: 16),
        _buildActionBtn(context, 'Lock', LucideIcons.lock, const Color(0xFF8b5cf6), isDark),
      ],
    );
  }

  Widget _buildActionBtn(BuildContext context, String title, IconData icon, Color color, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F2937) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  final String title;
  final String value;
  final String trend;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _StatusCard({
    required this.title,
    required this.value,
    required this.trend,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              Icon(LucideIcons.moreHorizontal, color: isDark ? Colors.white30 : Colors.black26),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              color: isDark ? Colors.white54 : Colors.black54,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              trend,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CapacityCircle extends StatelessWidget {
  final String title;
  final double percentage;
  final Color color;
  final bool isDark;

  const _CapacityCircle({
    required this.title,
    required this.percentage,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CircularPercentIndicator(
          radius: 55.0,
          lineWidth: 12.0,
          animation: true,
          percent: percentage,
          center: Text(
            "${(percentage * 100).toInt()}%",
            style: const TextStyle(
              fontWeight: FontWeight.w900, 
              fontSize: 22.0
            ),
          ),
          circularStrokeCap: CircularStrokeCap.round,
          progressColor: color,
          backgroundColor: isDark ? const Color(0xFF374151) : Colors.grey.shade100,
        ),
        const SizedBox(height: 16),
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ],
    );
  }
}
