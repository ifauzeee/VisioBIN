import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
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
    _messages = []; // Clear current view for smooth transition
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
      notifyListeners();
    }
  }

  Future<void> fetchMembers() async {
    try {
      final res = await apiService.listUsers();
      if (res.success) {
        final List<dynamic> data = res.data;
        _members = data.map((m) => AppUser.fromJson(m)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[ChatProvider] Fetch members error: $e');
    }
  }

  void connectWebSocket(String wsUrl) {
    _channel?.sink.close();
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      _channel!.stream.listen(
        (message) {
          final data = jsonDecode(message);
          if (data['event'] == 'chat_message') {
            final msg = ChatMessage.fromJson(data['data']);
            
            // Logic for live filtering
            final isGeneral = msg.recipientId == null;
            if (_selectedRecipient == null) {
              if (isGeneral) {
                _messages.add(msg);
                notifyListeners();
              }
            } else {
              // Private chat: filter by current recipient
              final isFromSelected = msg.senderId == _selectedRecipient!.id;
              final isToSelected = msg.recipientId == _selectedRecipient!.id;
              
              // Also check if it's for me
              final isForMe = msg.recipientId == _currentUserId;
              final isByMe = msg.senderId == _currentUserId;

              if ((isByMe && isToSelected) || (isFromSelected && isForMe)) {
                _messages.add(msg);
                notifyListeners();
              }
            }
          }
        },
        onError: (err) => debugPrint('[ChatProvider] WS Error: $err'),
        onDone: () => debugPrint('[ChatProvider] WS Closed'),
      );
    } catch (e) {
      debugPrint('[ChatProvider] WS Connect Error: $e');
    }
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
    _channel?.sink.close();
    super.dispose();
  }
}
