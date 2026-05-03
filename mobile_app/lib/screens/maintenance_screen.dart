import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../providers/maintenance_provider.dart';
import '../models/models.dart';

class MaintenanceScreen extends StatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  State<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MaintenanceProvider>().fetchLogs();
      context.read<MaintenanceProvider>().fetchBins();
    });
  }

  void _showAddLogModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AddLogModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Log Perawatan',
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black87,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black87),
        actions: [
          IconButton(
            icon: Icon(
              LucideIcons.refreshCcw,
              color: isDark ? Colors.white : Colors.black87,
            ),
            onPressed: () {
              context.read<MaintenanceProvider>().fetchLogs();
            },
          ),
        ],
      ),
      body: Consumer<MaintenanceProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.logs.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null && provider.logs.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(LucideIcons.alertCircle, size: 48, color: Colors.red[400]),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Terjadi Kesalahan',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      provider.error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: isDark ? Colors.white60 : Colors.black54),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => provider.fetchLogs(),
                    icon: const Icon(LucideIcons.refreshCcw, size: 16),
                    label: const Text('Coba Lagi'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  ),
                ],
              ),
            );
          }

          if (provider.logs.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.clipboardList, 
                    size: 80, 
                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Belum Ada Log',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Catatan perawatan akan tampil di sini.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: isDark ? Colors.white54 : Colors.black54,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: provider.fetchLogs,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
              itemCount: provider.logs.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final log = provider.logs[index];
                return _LogCard(log: log, isDark: isDark);
              },
            ),
          );
        },
      ),
        },
      ),
      floatingActionButton: context.read<DashboardProvider>().currentUser?.role == 'guest' 
        ? null 
        : Padding(
            padding: const EdgeInsets.only(bottom: 84),
            child: FloatingActionButton.extended(
              onPressed: () => _showAddLogModal(context),
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              icon: const Icon(LucideIcons.plus, size: 22),
              label: const Text(
                'Tambah Log',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
    );
  }
}

class _LogCard extends StatelessWidget {
  final MaintenanceLog log;
  final bool isDark;

  const _LogCard({required this.log, required this.isDark});

  IconData _getIcon(String actionType) {
    switch (actionType) {
      case 'cleaning': return LucideIcons.brush;
      case 'repair': return LucideIcons.wrench;
      case 'sensor_calibration': return LucideIcons.radio;
      case 'battery_replacement': return LucideIcons.batteryCharging;
      case 'bin_emptied': return LucideIcons.trash2;
      case 'inspection': return LucideIcons.search;
      default: return LucideIcons.fileText;
    }
  }

  String _getLabel(String actionType) {
    switch (actionType) {
      case 'cleaning': return 'Pembersihan';
      case 'repair': return 'Perbaikan Fisik';
      case 'sensor_calibration': return 'Kalibrasi Sensor';
      case 'battery_replacement': return 'Ganti Baterai';
      case 'bin_emptied': return 'Pengambilan Sampah';
      case 'inspection': return 'Inspeksi Rutin';
      default: return actionType;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy, HH:mm');
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(_getIcon(log.actionType), color: primaryColor),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getLabel(log.actionType),
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(LucideIcons.box, size: 12, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text(
                      log.binName ?? log.binId,
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                    const SizedBox(width: 8),
                    Icon(LucideIcons.calendar, size: 12, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text(
                      dateFormat.format(log.performedAt),
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                  ],
                ),
                if (log.notes.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.black26 : Colors.grey[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
                    ),
                    child: Text(
                      log.notes,
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? Colors.grey[400] : Colors.grey[700],
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  'Oleh: ${log.performerName ?? log.performedBy}',
                  style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AddLogModal extends StatefulWidget {
  @override
  State<_AddLogModal> createState() => _AddLogModalState();
}

class _AddLogModalState extends State<_AddLogModal> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedBinId;
  String? _selectedAction;
  final _notesController = TextEditingController();

  final Map<String, String> _actionTypes = {
    'cleaning': 'Pembersihan',
    'repair': 'Perbaikan Fisik',
    'sensor_calibration': 'Kalibrasi Sensor',
    'battery_replacement': 'Ganti Baterai',
    'bin_emptied': 'Pengambilan Sampah',
    'inspection': 'Inspeksi Rutin',
    'other': 'Lainnya',
  };

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState!.validate()) {
      final success = await context.read<MaintenanceProvider>().createLog(
        _selectedBinId!,
        _selectedAction!,
        _notesController.text,
      );

      if (success) {
        if (mounted) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Log perawatan berhasil disimpan!'),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        if (mounted) {
          final err = context.read<MaintenanceProvider>().error;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(err ?? 'Gagal menyimpan'),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MaintenanceProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
        top: 20,
        left: 24,
        right: 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tambah Log Perawatan',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _buildDropdownField(
              label: 'Unit Bin',
              icon: LucideIcons.box,
              value: _selectedBinId,
              hint: 'Pilih unit tempat sampah',
              isDark: isDark,
              items: provider.bins.map((bin) {
                return DropdownMenuItem(
                  value: bin.id,
                  child: Text(
                    '${bin.name} — ${bin.location}',
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList(),
              onChanged: (val) => setState(() => _selectedBinId = val),
              validator: (val) => val == null ? 'Pilih unit bin' : null,
            ),
            const SizedBox(height: 16),
            _buildDropdownField(
              label: 'Jenis Perawatan',
              icon: LucideIcons.wrench,
              value: _selectedAction,
              hint: 'Pilih jenis aktivitas',
              isDark: isDark,
              items: _actionTypes.entries.map((e) {
                return DropdownMenuItem(
                  value: e.key,
                  child: Text(e.value),
                );
              }).toList(),
              onChanged: (val) => setState(() => _selectedAction = val),
              validator: (val) => val == null ? 'Pilih jenis perawatan' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _notesController,
              maxLines: 3,
              style: TextStyle(color: isDark ? Colors.white : Colors.black87),
              decoration: InputDecoration(
                labelText: 'Catatan',
                hintText: 'Tulis detail tindakan...',
                alignLabelWithHint: true,
                prefixIcon: const Icon(LucideIcons.fileText, size: 20),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: primaryColor, width: 2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: provider.isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: provider.isLoading
                  ? const SizedBox(
                      width: 24, 
                      height: 24, 
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                    )
                  : const Text(
                      'Simpan Log', 
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required IconData icon,
    required String? value,
    required String hint,
    required bool isDark,
    required List<DropdownMenuItem<String>> items,
    required Function(String?) onChanged,
    required String? Function(String?) validator,
  }) {
    final primaryColor = Theme.of(context).colorScheme.primary;
    
    return DropdownButtonFormField<String>(
      isExpanded: true,
      value: value,
      items: items,
      onChanged: onChanged,
      validator: validator,
      style: TextStyle(color: isDark ? Colors.white : Colors.black87),
      dropdownColor: isDark ? const Color(0xFF1F2937) : Colors.white,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
      ),
    );
  }
}

