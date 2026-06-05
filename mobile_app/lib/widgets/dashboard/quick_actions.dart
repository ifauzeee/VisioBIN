import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_localizations.dart';
import '../../providers/dashboard_provider.dart';
import '../../screens/live_camera_screen.dart';

class QuickActions extends StatelessWidget {
  const QuickActions({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context)!;

    final actions = [
      _FieldAction(
        title: l10n.scanBin,
        icon: LucideIcons.scanLine,
        color: const Color(0xFF10b981),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const LiveCameraScreen()),
          );
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(l10n.scanBinOpened)),
          );
        },
      ),
      _FieldAction(
        title: l10n.liveCamera,
        icon: LucideIcons.video,
        color: const Color(0xFF3b82f6),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const LiveCameraScreen()),
          );
        },
      ),
      _FieldAction(
        title: l10n.reportIssue,
        icon: LucideIcons.clipboardList,
        color: const Color(0xFFf59e0b),
        onTap: () => _showFieldHint(context, l10n.reportIssuePrompt),
      ),
      _FieldAction(
        title: l10n.navigateToBin,
        icon: LucideIcons.navigation,
        color: const Color(0xFF8b5cf6),
        onTap: () => _showFieldHint(context, l10n.navigationPrompt),
      ),
      _FieldAction(
        title: l10n.syncOffline,
        icon: LucideIcons.refreshCw,
        color: const Color(0xFF06b6d4),
        onTap: () async {
          await context.read<DashboardProvider>().fetchAllData();
          if (context.mounted) {
            _showFieldHint(context, l10n.syncComplete);
          }
        },
      ),
    ];

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 0.92,
      children: actions.map((action) {
        return _buildActionBtn(
          context,
          action,
          isDark,
        );
      }).toList(),
    );
  }

  static void _showFieldHint(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Widget _buildActionBtn(
    BuildContext context,
    _FieldAction action,
    bool isDark,
  ) {
    return Semantics(
      button: true,
      label: action.title,
      child: InkWell(
        onTap: action.onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          constraints: const BoxConstraints(minHeight: 88),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
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
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  color: action.color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(action.icon, color: action.color, size: 22),
              ),
              const SizedBox(height: 10),
              Text(
                action.title,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FieldAction {
  const _FieldAction({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
}
