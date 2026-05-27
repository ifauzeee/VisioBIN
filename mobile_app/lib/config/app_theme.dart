import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design tokens for VisioBin app.
class AppColors {
  // Primary (Emerald green optimized for WCAG contrast)
  static const primary = Color(0xFF047857);
  static const primaryLight = Color(0xFF10b981);
  static const primaryDark = Color(0xFF065f46);
  
  // Secondary (Blue optimized for contrast)
  static const secondary = Color(0xFF1D4ED8);
  
  // Semantic Colors
  static const success = Color(0xFF047857);
  static const warning = Color(0xFFD97706);
  static const danger = Color(0xFFDC2626);
  static const info = Color(0xFF1D4ED8);
  
  // Light Theme Neutrals
  static const lightBg = Color(0xFFF3F4F6);
  static const lightSurface = Colors.white;
  static const lightTextPrimary = Color(0xFF111827);
  static const lightTextSecondary = Color(0xFF4B5563);
  static const lightBorder = Color(0xFFE5E7EB);
  
  // Dark Theme Neutrals
  static const darkBg = Color(0xFF030712); // Sleek AMOLED Gray-950
  static const darkSurface = Color(0xFF0B0F19); // Rich Slate-900 surface cards
  static const darkTextPrimary = Colors.white;
  static const darkTextSecondary = Color(0xFF94A3B8); // Slate-400
  static const darkBorder = Color(0xFF1E293B); // Slate-800 border
}

class AppSpacing {
  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
  static const double xxxl = 48.0;
}

class AppTheme {
  static ThemeData get light {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        brightness: Brightness.light,
        surface: AppColors.lightSurface,
      ),
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.lightBg,
      textTheme: GoogleFonts.plusJakartaSansTextTheme(
        ThemeData.light().textTheme,
      ).copyWith(
        titleLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: AppColors.lightTextPrimary,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: AppColors.lightTextPrimary,
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.lightBorder,
        thickness: 1,
      ),
    );
  }

  static ThemeData get dark {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        brightness: Brightness.dark,
        surface: AppColors.darkSurface,
      ),
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.darkBg,
      cardColor: AppColors.darkSurface,
      textTheme: GoogleFonts.plusJakartaSansTextTheme(
        ThemeData.dark().textTheme,
      ).copyWith(
        titleLarge: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: AppColors.darkTextPrimary,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.bold,
          color: AppColors.darkTextPrimary,
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.darkBorder,
        thickness: 1,
      ),
    );
  }
}
