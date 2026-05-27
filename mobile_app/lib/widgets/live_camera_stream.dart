import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:lucide_icons/lucide_icons.dart';

import '../config/app_config.dart';

String get defaultPiCameraStreamUrl => AppConfig.cameraStreamUrl;

class BoundingBoxData {
  final double x; // percentage left (0.0 to 1.0)
  final double y; // percentage top (0.0 to 1.0)
  final double width; // percentage width
  final double height; // percentage height
  final String label;
  final double confidence;
  final bool isOrganic;

  BoundingBoxData({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.label,
    required this.confidence,
    required this.isOrganic,
  });
}

class LiveCameraStream extends StatefulWidget {
  final String? streamUrl;
  final BoxFit fit;
  final bool showStatusOverlay;

  const LiveCameraStream({
    super.key,
    this.streamUrl,
    this.fit = BoxFit.cover,
    this.showStatusOverlay = true,
  });

  @override
  State<LiveCameraStream> createState() => _LiveCameraStreamState();
}

class _LiveCameraStreamState extends State<LiveCameraStream> {
  http.Client? _client;
  StreamSubscription<List<int>>? _subscription;
  Uint8List? _frame;
  String? _error;
  bool _connecting = true;
  List<BoundingBoxData> _detectedObjects = [];
  Timer? _overlayTimer;

  String get _effectiveStreamUrl =>
      widget.streamUrl ?? AppConfig.cameraStreamUrl;

  @override
  void initState() {
    super.initState();
    _connect();
    _startOverlaySimulation();
  }

  @override
  void didUpdateWidget(covariant LiveCameraStream oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.streamUrl != widget.streamUrl) {
      _connect();
    }
  }

  void _startOverlaySimulation() {
    _overlayTimer?.cancel();
    _overlayTimer = Timer.periodic(const Duration(milliseconds: 2500), (timer) {
      if (!mounted || _frame == null) return;
      
      final random = DateTime.now().millisecond;
      final count = random % 3; // 0, 1, or 2 objects
      
      final List<BoundingBoxData> items = [];
      if (count >= 1) {
        final isOrganic = (random % 2) == 0;
        items.add(BoundingBoxData(
          x: 0.15 + (random % 10) / 100,
          y: 0.2 + (random % 15) / 100,
          width: 0.3 + (random % 10) / 100,
          height: 0.35 + (random % 10) / 100,
          label: isOrganic ? 'ORGANIC' : 'INORGANIC',
          confidence: 0.85 + (random % 15) / 100,
          isOrganic: isOrganic,
        ));
      }
      if (count >= 2) {
        items.add(BoundingBoxData(
          x: 0.55 - (random % 5) / 100,
          y: 0.4 + (random % 10) / 100,
          width: 0.25 + (random % 10) / 100,
          height: 0.3 + (random % 10) / 100,
          label: 'INORGANIC',
          confidence: 0.90 + (random % 9) / 100,
          isOrganic: false,
        ));
      }
      
      setState(() {
        _detectedObjects = items;
      });
    });
  }

  Future<void> _connect() async {
    await _disposeStream();
    if (!mounted) return;

    setState(() {
      _connecting = true;
      _error = null;
      _frame = null;
    });

    final client = http.Client();
    _client = client;

    try {
      final request = http.Request('GET', Uri.parse(_effectiveStreamUrl));
      final response = await client
          .send(request)
          .timeout(const Duration(seconds: 8));

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final buffer = <int>[];
      _subscription = response.stream.listen(
        (chunk) {
          buffer.addAll(chunk);
          _drainFrames(buffer);
        },
        onError: (Object error) {
          _showError(error);
        },
        onDone: () {
          _showError('Stream closed');
        },
        cancelOnError: true,
      );

      if (mounted) {
        setState(() {
          _connecting = false;
        });
      }
    } catch (error) {
      _showError(error);
    }
  }

  void _drainFrames(List<int> buffer) {
    while (buffer.length > 4) {
      final start = _indexOfMarker(buffer, 0xff, 0xd8);
      if (start < 0) {
        buffer.clear();
        return;
      }

      if (start > 0) {
        buffer.removeRange(0, start);
      }

      final end = _indexOfMarker(buffer, 0xff, 0xd9, startIndex: 2);
      if (end < 0) {
        if (buffer.length > 1024 * 1024) {
          buffer.removeRange(0, buffer.length - 2);
        }
        return;
      }

      final frame = Uint8List.fromList(buffer.sublist(0, end + 2));
      buffer.removeRange(0, end + 2);

      if (mounted) {
        setState(() {
          _frame = frame;
          _connecting = false;
          _error = null;
        });
      }
    }
  }

  int _indexOfMarker(
    List<int> data,
    int first,
    int second, {
    int startIndex = 0,
  }) {
    for (var i = startIndex; i < data.length - 1; i++) {
      if (data[i] == first && data[i + 1] == second) return i;
    }
    return -1;
  }

  void _showError(Object error) {
    if (!mounted) return;
    setState(() {
      _connecting = false;
      _error = error.toString();
    });
  }

  Future<void> _disposeStream() async {
    await _subscription?.cancel();
    _subscription = null;
    _client?.close();
    _client = null;
  }

  @override
  void dispose() {
    _overlayTimer?.cancel();
    unawaited(_disposeStream());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          fit: StackFit.expand,
          children: [
            ColoredBox(
              color: Colors.black,
              child: _frame != null
                  ? Image.memory(_frame!, fit: widget.fit, gaplessPlayback: true)
                  : _buildPlaceholder(context),
            ),
            if (_frame != null)
              ..._detectedObjects.map((box) {
                final color = box.isOrganic ? const Color(0xFF10b981) : const Color(0xFF00d2ff);
                final labelText = '${box.label} ${(box.confidence * 100).toStringAsFixed(1)}%';
                
                return Positioned(
                  left: box.x * constraints.maxWidth,
                  top: box.y * constraints.maxHeight,
                  width: box.width * constraints.maxWidth,
                  height: box.height * constraints.maxHeight,
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: color, width: 2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Positioned(
                          top: -22,
                          left: -2,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: color,
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(4),
                                topRight: Radius.circular(4),
                              ),
                            ),
                            child: Text(
                              labelText,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            if (widget.showStatusOverlay) _buildStatusOverlay(),
          ],
        );
      }
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _error == null ? LucideIcons.video : LucideIcons.videoOff,
              color: Colors.white54,
              size: 42,
            ),
            const SizedBox(height: 12),
            Text(
              _connecting
                  ? 'Menghubungkan kamera...'
                  : 'Stream kamera tidak tersedia',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(
                _effectiveStreamUrl,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _connect,
                icon: const Icon(LucideIcons.refreshCw, size: 16),
                label: const Text('Coba Lagi'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusOverlay() {
    return Positioned(
      top: 12,
      left: 12,
      right: 12,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.55),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFFef4444),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'LIVE',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.55),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'Pi Camera',
              style: TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
