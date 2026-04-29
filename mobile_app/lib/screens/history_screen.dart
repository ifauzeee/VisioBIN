import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan History'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: _dummyData.length,
        itemBuilder: (context, index) {
          final item = _dummyData[index];
          return _HistoryCard(item: item, isDark: isDark);
        },
      ),
    );
  }
}

class _HistoryItem {
  final String title;
  final String time;
  final String type;
  final double confidence;

  _HistoryItem(this.title, this.time, this.type, this.confidence);
}

final List<_HistoryItem> _dummyData = [
  _HistoryItem('Banana Peel', '10:42 AM', 'Organic', 0.98),
  _HistoryItem('Plastic Bottle', '09:15 AM', 'Non-Organic', 0.95),
  _HistoryItem('Apple Core', 'Yesterday', 'Organic', 0.99),
  _HistoryItem('Soda Can', 'Yesterday', 'Non-Organic', 0.92),
  _HistoryItem('Cardboard Box', 'Yesterday', 'Non-Organic', 0.88),
  _HistoryItem('Coffee Grounds', '2 Days Ago', 'Organic', 0.97),
];

class _HistoryCard extends StatelessWidget {
  final _HistoryItem item;
  final bool isDark;

  const _HistoryCard({required this.item, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final isOrganic = item.type == 'Organic';
    final typeColor = isOrganic ? const Color(0xFF10b981) : const Color(0xFFf59e0b);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: typeColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isOrganic ? LucideIcons.leaf : LucideIcons.packageOpen,
              color: typeColor,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      item.time,
                      style: TextStyle(
                        color: isDark ? Colors.white54 : Colors.black54,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: typeColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        item.type,
                        style: TextStyle(
                          color: typeColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${(item.confidence * 100).toInt()}%',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Text(
                'Confidence',
                style: TextStyle(
                  color: isDark ? Colors.white54 : Colors.black54,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
