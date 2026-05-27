import 'package:flutter/material.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';

class CapacityCircle extends StatelessWidget {
  final String title;
  final double percentage;
  final Color color;
  final bool isDark;

  const CapacityCircle({
    super.key,
    required this.title,
    required this.percentage,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CircularPercentIndicator(
          radius: 55.0,
          lineWidth: 12.0,
          animation: true,
          percent: percentage,
          center: Text(
            "${(percentage * 100).toInt()}%",
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22.0),
          ),
          circularStrokeCap: CircularStrokeCap.round,
          progressColor: color,
          backgroundColor: isDark
              ? const Color(0xFF374151)
              : Colors.grey.shade100,
        ),
        const SizedBox(height: 16),
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ],
    );
  }
}
