import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class ChatProvider extends ChangeNotifier {
  final ApiService apiService;
  List<ChatMessage> _messages = [];
  List<AppUser> _members = [];
  bool _isLoading = false;
  bool _fetchingHistory = false;
  WebSocketChannel? _channel;
  AppUser? _selectedRecipient;
  String? _currentUserId;
  String? _wsUrl;
  Timer? _reconnectTimer;
  bool _isDisposed = false;

  ChatProvider(this.apiService);

  List<ChatMessage> get messages => _messages;
  List<AppUser> get members => _members;
  bool get isLoading => _isLoading;
  bool get fetchingHistory => _fetchingHistory;
  AppUser? get selectedRecipient => _selectedRecipient;

  void setCurrentUserId(String? id) {
    _currentUserId = id;
  }

  void setSelectedRecipient(AppUser? user) {
    if (_selectedRecipient?.id == user?.id) return;
    _selectedRecipient = user;
    _messages = []; 
    fetchHistory();
    notifyListeners();
  }

  Future<void> fetchHistory() async {
    _fetchingHistory = true;
    notifyListeners();

    try {
      final res = await apiService.getChatHistory(
        otherId: _selectedRecipient?.id,
      );
      if (res.success) {
        final List<dynamic> data = res.data;
        _messages = data.map((m) => ChatMessage.fromJson(m)).toList();
      }
    } catch (e) {
      debugPrint('[ChatProvider] Fetch history error: $e');
    } finally {
      _fetchingHistory = false;
      _isLoading = false;
      if (!_isDisposed) notifyListeners();
    }
  }

  Future<void> fetchMembers() async {
    try {
      final res = await apiService.listUsers();
      if (res.success) {
        final List<dynamic> data = res.data;
        _members = data.map((m) => AppUser.fromJson(m)).toList();
        if (!_isDisposed) notifyListeners();
      }
    } catch (e) {
      debugPrint('[ChatProvider] Fetch members error: $e');
    }
  }

  void connectWebSocket(String wsUrl) {
    _wsUrl = wsUrl;
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    
    debugPrint('[ChatProvider] Connecting to WS: $wsUrl');
    
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      _channel!.stream.listen(
        (message) {
          debugPrint('[ChatProvider] WS Message Received: $message');
          final data = jsonDecode(message);
          if (data['event'] == 'chat_message') {
            final msg = ChatMessage.fromJson(data['data']);
            
            final isGeneral = msg.recipientId == null;
            if (_selectedRecipient == null) {
              if (isGeneral) {
                _messages.add(msg);
                if (!_isDisposed) notifyListeners();
              }
            } else {
              final isFromSelected = msg.senderId == _selectedRecipient!.id;
              final isToSelected = msg.recipientId == _selectedRecipient!.id;
              final isForMe = msg.recipientId == _currentUserId;
              final isByMe = msg.senderId == _currentUserId;

              if ((isByMe && isToSelected) || (isFromSelected && isForMe)) {
                _messages.add(msg);
                if (!_isDisposed) notifyListeners();
              }
            }
          }
        },
        onError: (err) {
          debugPrint('[ChatProvider] WS Error: $err');
          _scheduleReconnect();
        },
        onDone: () {
          debugPrint('[ChatProvider] WS Connection Closed');
          _scheduleReconnect();
        },
      );
    } catch (e) {
      debugPrint('[ChatProvider] WS Connect Exception: $e');
      _scheduleReconnect();
    }
  }

  void _scheduleReconnect() {
    if (_isDisposed) return;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 3), () {
      if (_wsUrl != null && !_isDisposed) {
        debugPrint('[ChatProvider] Reconnecting...');
        connectWebSocket(_wsUrl!);
      }
    });
  }

  Future<bool> sendMessage(String content) async {
    final res = await apiService.sendChatMessage(
      content,
      recipientId: _selectedRecipient?.id,
    );
    return res.success;
  }

  @override
  void dispose() {
    _isDisposed = true;
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    super.dispose();
  }
}
