import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/dashboard/status_card.dart';
import '../widgets/dashboard/capacity_indicators.dart';
import '../widgets/dashboard/live_camera_card.dart';
import '../widgets/dashboard/analytics_chart.dart';
import '../widgets/dashboard/quick_actions.dart';
import '../widgets/dashboard/recent_activity_list.dart';
import '../widgets/dashboard/alerts_bottom_sheet.dart';
import '../widgets/dashboard/skeleton_loader.dart';
import 'live_camera_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final provider = context.watch<DashboardProvider>();

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => provider.fetchAllData(),
          color: const Color(0xFF10b981),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.all(24.0),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildHeader(context, provider),
                    const SizedBox(height: 32),
                    if (provider.isLoading)
                      _buildLoadingState()
                    else if (provider.error != null)
                      _buildErrorState(provider)
                    else ...[
                      _buildStatusCards(isDark, provider),
                      const SizedBox(height: 32),
                      Text(
                        'System Status',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      _buildSystemStatus(isDark, provider),
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Live Camera',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          TextButton.icon(
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => const LiveCameraScreen(),
                              ),
                            ),
                            icon: const Icon(LucideIcons.maximize2, size: 16),
                            label: const Text('Open'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const LiveCameraCard(),
                      const SizedBox(height: 32),
                      Text(
                        'Real-time Capacity',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      CapacityIndicators(provider: provider),
                      const SizedBox(height: 32),
                      Text(
                        'Weekly Scan Analytics',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      AnalyticsChart(provider: provider),
                      const SizedBox(height: 32),
                      Text(
                        'Quick Actions',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),
                      const QuickActions(),
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
                      RecentActivityList(provider: provider),
                    ],
                    const SizedBox(height: 100), // padding for bottom nav
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const DashboardSkeletonLoader();
  }

  Widget _buildErrorState(DashboardProvider provider) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 60),
        child: Column(
          children: [
            const Icon(LucideIcons.wifiOff, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              provider.error ?? 'Terjadi kesalahan',
              style: const TextStyle(color: Colors.grey, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => provider.fetchAllData(),
              icon: const Icon(LucideIcons.refreshCw, size: 16),
              label: const Text('Coba Lagi'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF10b981),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, DashboardProvider provider) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dashboard',
              style: Theme.of(
                context,
              ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              provider.lastUpdated != null
                  ? 'Updated ${_formatTime(provider.lastUpdated!)}'
                  : 'VisioBin Analytics Overview',
              style: TextStyle(
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.5),
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        Row(
          children: [
            if (context.read<DashboardProvider>().currentUser?.role == 'guest')
              Padding(
                padding: const EdgeInsets.only(right: 12.0),
                child: GestureDetector(
                  onTap: () => context.read<DashboardProvider>().logout(),
                  child: Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.red.withValues(alpha: 0.2),
                      ),
                    ),
                    child: const Icon(LucideIcons.logOut, color: Colors.red),
                  ),
                ),
              ),
            GestureDetector(
              onTap: () => _showAlertsBottomSheet(context, provider),
              child: Stack(
                children: [
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
                  if (provider.unreadAlertCount > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        width: 20,
                        height: 20,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            provider.unreadAlertCount > 9
                                ? '9+'
                                : provider.unreadAlertCount.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatusCards(bool isDark, DashboardProvider provider) {
    return Row(
      children: [
        Expanded(
          child: StatusCard(
            title: 'Total Scans',
            value: provider.summary.totalProcessed.toString(),
            trend:
                '${provider.summary.organicCountToday}O / ${provider.summary.inorganicCountToday}A',
            icon: LucideIcons.scanLine,
            color: const Color(0xFF8b5cf6),
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: StatusCard(
            title: 'Avg. Accuracy',
            value: '${provider.averageAccuracy.toStringAsFixed(1)}%',
            trend: provider.recentClassifications.isNotEmpty
                ? 'Live Data'
                : 'Belum ada data',
            icon: LucideIcons.target,
            color: const Color(0xFF10b981),
            isDark: isDark,
          ),
        ),
      ],
    );
  }

  Widget _buildSystemStatus(bool isDark, DashboardProvider provider) {
    return Row(
      children: [
        Expanded(
          child: StatusCard(
            title: 'Active Bins',
            value:
                '${provider.summary.activeBins}/${provider.summary.totalBins}',
            trend: provider.summary.activeBins == provider.summary.totalBins
                ? 'All Online'
                : 'Partial',
            icon: LucideIcons.box,
            color: const Color(0xFF3b82f6),
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: StatusCard(
            title: 'Alerts',
            value: '${provider.unreadAlertCount}',
            trend: provider.unreadAlertCount == 0 ? 'All Clear' : 'Pending',
            icon: LucideIcons.bell,
            color: provider.unreadAlertCount > 0
                ? const Color(0xFFef4444)
                : const Color(0xFF10b981),
            isDark: isDark,
          ),
        ),
      ],
    );
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  void _showAlertsBottomSheet(
    BuildContext context,
    DashboardProvider provider,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => AlertsBottomSheet(provider: provider),
    );
  }
}
