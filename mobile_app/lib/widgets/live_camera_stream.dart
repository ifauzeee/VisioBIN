import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:lucide_icons/lucide_icons.dart';

const String defaultPiCameraStreamUrl = 'http://192.168.1.8:8000/stream';

class LiveCameraStream extends StatefulWidget {
  final String streamUrl;
  final BoxFit fit;
  final bool showStatusOverlay;

  const LiveCameraStream({
    super.key,
    this.streamUrl = defaultPiCameraStreamUrl,
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

  @override
  void initState() {
    super.initState();
    _connect();
  }

  @override
  void didUpdateWidget(covariant LiveCameraStream oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.streamUrl != widget.streamUrl) {
      _connect();
    }
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
      final request = http.Request('GET', Uri.parse(widget.streamUrl));
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
    unawaited(_disposeStream());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ColoredBox(
          color: Colors.black,
          child: _frame != null
              ? Image.memory(_frame!, fit: widget.fit, gaplessPlayback: true)
              : _buildPlaceholder(context),
        ),
        if (widget.showStatusOverlay) _buildStatusOverlay(),
      ],
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
                widget.streamUrl,
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
              color: Colors.black.withValues(alpha: 0.55),
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
              color: Colors.black.withValues(alpha: 0.55),
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
