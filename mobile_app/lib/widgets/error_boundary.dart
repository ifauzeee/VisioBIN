import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class AppErrorBoundary extends StatefulWidget {
  final Widget child;
  final VoidCallback? onRetry;

  const AppErrorBoundary({
    super.key,
    required this.child,
    this.onRetry,
  });

  @override
  State<AppErrorBoundary> createState() => _AppErrorBoundaryState();
}

class _AppErrorBoundaryState extends State<AppErrorBoundary> {
  late ErrorWidgetBuilder _originalBuilder;
  bool _hasError = false;
  Object? _exception;

  @override
  void initState() {
    super.initState();
    _originalBuilder = ErrorWidget.builder;
    ErrorWidget.builder = (FlutterErrorDetails details) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _exception = details.exception;
        });
      }
      return _buildErrorUI(details.exception.toString());
    };
  }

  @override
  void dispose() {
    ErrorWidget.builder = _originalBuilder;
    super.dispose();
  }

  Widget _buildErrorUI(String errorMessage) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF111827) : const Color(0xFFF3F4F6),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LucideIcons.alertTriangle,
                  size: 48,
                  color: Colors.red[400],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Terjadi Kesalahan Sistem',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                errorMessage,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white54 : Colors.black54,
                  height: 1.4,
                ),
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _hasError = false;
                    _exception = null;
                  });
                  widget.onRetry?.call();
                },
                icon: const Icon(LucideIcons.refreshCw, size: 14),
                label: const Text('Coba Lagi'),
                style: ElevatedButton.styleFrom(
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return _buildErrorUI(_exception?.toString() ?? 'Gagal memproses tampilan halaman ini.');
    }
    return widget.child;
  }
}
