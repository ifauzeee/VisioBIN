import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/main_screen.dart';

void main() {
  runApp(const VisioBinApp());
}

class VisioBinApp extends StatelessWidget {
  const VisioBinApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VisioBin',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10b981), // Emerald green
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        textTheme: GoogleFonts.outfitTextTheme(Theme.of(context).textTheme).copyWith(
          titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          headlineMedium: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        scaffoldBackgroundColor: const Color(0xFFF3F4F6),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10b981),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
          titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          headlineMedium: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        scaffoldBackgroundColor: const Color(0xFF111827),
      ),
      themeMode: ThemeMode.system,
      home: const MainScreen(),
    );
  }
}
