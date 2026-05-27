import 'package:flutter/material.dart';

/// A generic skeleton item with a pulsing fade animation.
class SkeletonPlaceholder extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadiusGeometry? borderRadius;

  const SkeletonPlaceholder({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius,
  });

  @override
  State<SkeletonPlaceholder> createState() => _SkeletonPlaceholderState();
}

class _SkeletonPlaceholderState extends State<SkeletonPlaceholder>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    
    _animation = Tween<double>(begin: 0.35, end: 0.7).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB);

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Opacity(
          opacity: _animation.value,
          child: Container(
            width: widget.width,
            height: widget.height,
            decoration: BoxDecoration(
              color: baseColor,
              borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
            ),
          ),
        );
      },
    );
  }
}

/// A composite skeleton loader that mimics the dashboard layout.
class DashboardSkeletonLoader extends StatelessWidget {
  const DashboardSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Status cards placeholder (Row of two cards)
        Row(
          children: [
            Expanded(
              child: _buildCardSkeleton(height: 160),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildCardSkeleton(height: 160),
            ),
          ],
        ),
        const SizedBox(height: 32),
        _buildSectionHeaderSkeleton(),
        const SizedBox(height: 16),
        // System status placeholder (Row of two cards)
        Row(
          children: [
            Expanded(
              child: _buildCardSkeleton(height: 160),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildCardSkeleton(height: 160),
            ),
          ],
        ),
        const SizedBox(height: 32),
        _buildSectionHeaderSkeleton(),
        const SizedBox(height: 16),
        // Live camera card placeholder
        _buildCardSkeleton(height: 250),
        const SizedBox(height: 32),
        _buildSectionHeaderSkeleton(),
        const SizedBox(height: 16),
        // Capacity indicators placeholder
        _buildCardSkeleton(height: 200),
        const SizedBox(height: 32),
        _buildSectionHeaderSkeleton(),
        const SizedBox(height: 16),
        // Weekly scan analytics placeholder
        _buildCardSkeleton(height: 300),
        const SizedBox(height: 32),
        _buildSectionHeaderSkeleton(),
        const SizedBox(height: 16),
        // Quick actions placeholder
        Row(
          children: [
            Expanded(child: _buildCardSkeleton(height: 100)),
            const SizedBox(width: 16),
            Expanded(child: _buildCardSkeleton(height: 100)),
            const SizedBox(width: 16),
            Expanded(child: _buildCardSkeleton(height: 100)),
          ],
        ),
      ],
    );
  }

  Widget _buildCardSkeleton({required double height}) {
    return SkeletonPlaceholder(
      width: double.infinity,
      height: height,
      borderRadius: BorderRadius.circular(28),
    );
  }

  Widget _buildSectionHeaderSkeleton() {
    return const SkeletonPlaceholder(
      width: 150,
      height: 20,
    );
  }
}
