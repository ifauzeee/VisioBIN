import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/dashboard_provider.dart';
import '../providers/chat_provider.dart';
import '../widgets/dashboard/status_card.dart';
import '../widgets/dashboard/capacity_indicators.dart';
import '../widgets/dashboard/live_camera_card.dart';
import '../widgets/dashboard/analytics_chart.dart';
import '../widgets/dashboard/quick_actions.dart';
import '../widgets/dashboard/recent_activity_list.dart';
import '../widgets/dashboard/alerts_bottom_sheet.dart';
import '../widgets/dashboard/skeleton_loader.dart';
import '../config/route_transitions.dart';
import '../l10n/app_localizations.dart';
import 'live_camera_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _showTutorial = false;
  int _tutorialStep = 0;

  @override
  void initState() {
    super.initState();
    _checkTutorial();
  }

  Future<void> _checkTutorial() async {
    final prefs = await SharedPreferences.getInstance();
    final onboarded = prefs.getBool('mobile_onboarded') ?? false;
    if (!onboarded) {
      setState(() {
        _showTutorial = true;
        _tutorialStep = 0;
      });
    }
  }

  Future<void> _completeTutorial() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('mobile_onboarded', true);
    setState(() {
      _showTutorial = false;
    });
  }

  void _startTutorial() {
    setState(() {
      _showTutorial = true;
      _tutorialStep = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final provider = context.watch<DashboardProvider>();
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            RefreshIndicator(
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
                        if (provider.isOfflineData) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFf59e0b).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFFf59e0b).withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(LucideIcons.wifiOff, color: Color(0xFFf59e0b), size: 18),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    l10n.offlineModeLastData,
                                    style: TextStyle(
                                      color: isDark ? Colors.amber[200] : Colors.amber[900],
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 32),
                        if (provider.isLoading)
                          _buildLoadingState()
                        else if (provider.error != null)
                          _buildErrorState(provider)
                        else ...[
                          _buildStatusCards(isDark, provider),
                          const SizedBox(height: 32),
                          Text(
                            l10n.systemStatus,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),
                          _buildSystemStatus(isDark, provider),
                          const SizedBox(height: 32),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                l10n.liveCamera,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              Semantics(
                                button: true,
                                label: l10n.openFullVideoStream,
                                child: TextButton.icon(
                                  onPressed: () => Navigator.of(context).push(
                                    FadeSlidePageRoute(
                                      child: const LiveCameraScreen(),
                                    ),
                                  ),
                                  icon: const Icon(LucideIcons.maximize2, size: 16),
                                  label: Text(l10n.open),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const LiveCameraCard(),
                          const SizedBox(height: 32),
                          Text(
                            l10n.realTimeCapacity,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),
                          CapacityIndicators(provider: provider),
                          const SizedBox(height: 32),
                          Text(
                            l10n.weeklyScanAnalytics,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),
                          AnalyticsChart(provider: provider),
                          const SizedBox(height: 32),
                          Text(
                            l10n.quickActions,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),
                          const QuickActions(),
                          const SizedBox(height: 32),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                l10n.recentActivity,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              TextButton(
                                onPressed: () {},
                                child: Text(l10n.viewAll),
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
            if (_showTutorial) _buildTutorialOverlay(context),
          ],
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
    final chatProvider = context.watch<ChatProvider>();
    final isConnected = chatProvider.isWsConnected;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Dashboard',
                  style: Theme.of(
                    context,
                  ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: isConnected ? const Color(0xFF10b981) : const Color(0xFFef4444),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: (isConnected ? const Color(0xFF10b981) : const Color(0xFFef4444)).withOpacity(0.4),
                        blurRadius: 6,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
              ],
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
            Semantics(
              button: true,
              label: 'Mulai Panduan Fitur',
              child: Tooltip(
                message: 'Panduan Fitur',
                child: GestureDetector(
                  onTap: _startTutorial,
                  child: Container(
                    width: 50,
                    height: 50,
                    margin: const EdgeInsets.only(right: 12.0),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                      ),
                    ),
                    child: const Icon(LucideIcons.helpCircle, color: Color(0xFF10b981)),
                  ),
                ),
              ),
            ),
            if (context.read<DashboardProvider>().currentUser?.role == 'guest')
              Padding(
                padding: const EdgeInsets.only(right: 12.0),
                child: Semantics(
                  button: true,
                  label: 'Logout Guest',
                  child: Tooltip(
                    message: 'Logout Guest',
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
                ),
              ),
            Semantics(
              button: true,
              label: 'Notifikasi Alerts',
              child: Tooltip(
                message: 'Lihat Alerts',
                child: GestureDetector(
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

  Widget _buildTutorialOverlay(BuildContext context) {
    final steps = [
      {
        'title': 'Metrik Ringkasan Utama',
        'desc': 'Di sini Anda dapat melihat total scan data telemetri, volume organik & anorganik harian, serta akurasi rata-rata deteksi AI.',
      },
      {
        'title': 'Kamera Deteksi AI',
        'desc': 'Viewport feed video real-time dari Raspberry Pi stasiun sampah dengan deteksi objek otomatis.',
      },
      {
        'title': 'Kapasitas Real-time',
        'desc': 'Menampilkan persentase keterisian stasiun tempat sampah VisioBIN secara real-time.',
      },
      {
        'title': 'Grafik & Aktivitas Harian',
        'desc': 'Visualisasi tren keterisian mingguan serta log aktivitas terbaru dari unit stasiun sampah.',
      }
    ];

    final step = steps[_tutorialStep];

    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.75),
        child: Center(
          child: Card(
            margin: const EdgeInsets.symmetric(horizontal: 32),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: const BorderSide(color: Color(0xFF10b981), width: 1.5),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '✨ ${step['title']}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF10b981),
                          ),
                        ),
                      ),
                      Text(
                        '${_tutorialStep + 1}/${steps.length}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    step['desc']!,
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: _completeTutorial,
                        child: const Text('Lewati'),
                      ),
                      Row(
                        children: [
                          if (_tutorialStep > 0)
                            TextButton(
                              onPressed: () {
                                setState(() {
                                    _tutorialStep--;
                                });
                              },
                              child: const Text('Kembali'),
                            ),
                          const SizedBox(width: 8),
                          FilledButton(
                            onPressed: () {
                              if (_tutorialStep < steps.length - 1) {
                                setState(() {
                                  _tutorialStep++;
                                });
                              } else {
                                _completeTutorial();
                              }
                            },
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFF10b981),
                            ),
                            child: Text(_tutorialStep == steps.length - 1 ? 'Selesai' : 'Lanjut'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
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
