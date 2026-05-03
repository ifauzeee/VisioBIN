import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/dashboard_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) return;

    final provider = context.read<DashboardProvider>();
    await provider.login(username, password);
  }

  Future<void> _handleGuestLogin() async {
    final provider = context.read<DashboardProvider>();
    await provider.loginAsGuest();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final provider = context.watch<DashboardProvider>();

    return Scaffold(
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white : Colors.black,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF10b981).withValues(alpha: 0.3),
                          blurRadius: 30,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Icon(
                      LucideIcons.trash2,
                      color: isDark ? Colors.black : Colors.white,
                      size: 36,
                    ),
                  ),

                  const SizedBox(height: 24),

                  Text(
                    'VisioBin',
                    style: GoogleFonts.outfit(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -1,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(
                    'Smart Waste Management System',
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? Colors.white54 : Colors.black45,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const SizedBox(height: 48),

                  // Username field
                  TextField(
                    controller: _usernameController,
                    decoration: InputDecoration(
                      labelText: 'Nama Pengguna',
                      hintText: 'admin',
                      prefixIcon: const Icon(LucideIcons.user, size: 20),
                      filled: true,
                      fillColor: isDark
                          ? const Color(0xFF1F2937)
                          : Colors.grey.shade50,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(
                          color: isDark
                              ? Colors.white12
                              : Colors.grey.shade200,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(
                          color: isDark
                              ? Colors.white12
                              : Colors.grey.shade200,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(
                          color: Color(0xFF10b981),
                          width: 2,
                        ),
                      ),
                    ),
                    textInputAction: TextInputAction.next,
                  ),

                  const SizedBox(height: 16),

                  // Password field
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Kata Sandi',
                      hintText: '••••••••',
                      prefixIcon: const Icon(LucideIcons.lock, size: 20),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? LucideIcons.eyeOff
                              : LucideIcons.eye,
                          size: 20,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      filled: true,
                      fillColor: isDark
                          ? const Color(0xFF1F2937)
                          : Colors.grey.shade50,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(
                          color: isDark
                              ? Colors.white12
                              : Colors.grey.shade200,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(
                          color: isDark
                              ? Colors.white12
                              : Colors.grey.shade200,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(
                          color: Color(0xFF10b981),
                          width: 2,
                        ),
                      ),
                    ),
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _handleLogin(),
                  ),

                  // Error message
                  if (provider.loginError != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.red.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.alertCircle,
                              color: Colors.red, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              provider.loginError!,
                              style: const TextStyle(
                                color: Colors.red,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),

                  // Login button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: FilledButton(
                      onPressed: provider.isLoggingIn ? null : _handleLogin,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF10b981),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: provider.isLoggingIn
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2.5,
                              ),
                            )
                          : const Text(
                              'Masuk ke Sistem',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Guest Login button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton(
                      onPressed: provider.isLoggingIn ? null : _handleGuestLogin,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: isDark ? Colors.white12 : Colors.grey.shade300,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: provider.isLoggingIn
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              'Masuk sebagai Tamu',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                    ),
                  ),

                  const SizedBox(height: 40),

                  // Security badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        LucideIcons.shieldCheck,
                        size: 14,
                        color: const Color(0xFF10b981).withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Diamankan oleh Protokol VisioBin',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white38 : Colors.black38,
                        ),
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
}
