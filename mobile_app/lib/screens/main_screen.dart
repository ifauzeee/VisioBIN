import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/dashboard_provider.dart';
import 'dashboard_screen.dart';
import 'history_screen.dart';
import 'maintenance_screen.dart';
import 'chat_screen.dart';
import 'settings_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  List<Widget> _getScreens(bool isGuest) {
    return [
      const DashboardScreen(),
      const HistoryScreen(),
      const MaintenanceScreen(),
      const ChatScreen(),
      if (!isGuest) const SettingsScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    final isGuest = context.read<DashboardProvider>().currentUser?.role == 'guest';
    final screens = _getScreens(isGuest);

    return Scaffold(
      extendBody: true, // Allows body to scroll behind the floating navbar
      body: IndexedStack(
        index: _currentIndex >= screens.length ? 0 : _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          margin: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1F2937) : Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 12.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(LucideIcons.layoutDashboard, 'Home', 0, isDark, primaryColor),
                _buildNavItem(LucideIcons.history, 'History', 1, isDark, primaryColor),
                _buildNavItem(LucideIcons.wrench, 'Repair', 2, isDark, primaryColor),
                _buildNavItem(LucideIcons.messageSquare, 'Chat', 3, isDark, primaryColor),
                if (!isGuest) _buildNavItem(LucideIcons.settings, 'Config', 4, isDark, primaryColor),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index, bool isDark, Color primaryColor) {
    final isSelected = _currentIndex == index;

    return GestureDetector(
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutQuart,
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 18.0 : 12.0, 
          vertical: 10.0
        ),
        decoration: BoxDecoration(
          color: isSelected ? primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(22),
          boxShadow: isSelected ? [
            BoxShadow(
              color: primaryColor.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 6),
            )
          ] : [],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected 
                  ? Colors.white 
                  : (isDark ? Colors.white60 : Colors.black54),
              size: 20,
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeOutQuart,
              child: isSelected
                  ? Padding(
                      padding: const EdgeInsets.only(left: 8.0),
                      child: Text(
                        label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}
