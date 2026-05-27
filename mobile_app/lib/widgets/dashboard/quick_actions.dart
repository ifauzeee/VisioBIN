import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../providers/dashboard_provider.dart';

class QuickActions extends StatelessWidget {
  const QuickActions({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      children: [
        _buildActionBtn(
          context,
          'Empty Bin',
          LucideIcons.trash2,
          const Color(0xFFef4444),
          isDark,
        ),
        const SizedBox(width: 16),
        _buildActionBtn(
          context,
          'Calibrate',
          LucideIcons.settings2,
          const Color(0xFF3b82f6),
          isDark,
        ),
        const SizedBox(width: 16),
        _buildActionBtn(
          context,
          'Refresh',
          LucideIcons.refreshCw,
          const Color(0xFF8b5cf6),
          isDark,
        ),
      ],
    );
  }

  Widget _buildActionBtn(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    bool isDark,
  ) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (title == 'Refresh') {
            context.read<DashboardProvider>().fetchAllData();
          }
        },
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
      ),
    );
  }
}
