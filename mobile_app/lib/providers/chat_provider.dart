import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../screens/chat_screen.dart';

class ChatProvider extends ChangeNotifier {
  final ApiService apiService;
  List<ChatMessage> _messages = [];
  List<AppUser> _members = [];
  bool _isLoading = false;
  bool _fetchingHistory = false;
  WebSocketChannel? _channel;
  bool _isWsConnected = false;
  AppUser? _selectedRecipient;
  String? _currentUserId;
  String? _wsUrl;
  Timer? _reconnectTimer;
  bool _isDisposed = false;
  GlobalKey<NavigatorState>? _navigatorKey;

  ChatProvider(this.apiService);

  void setNavigatorKey(GlobalKey<NavigatorState> key) {
    _navigatorKey = key;
  }

  List<ChatMessage> get messages => _messages;
  List<AppUser> get members => _members;
  bool get isLoading => _isLoading;
  bool get fetchingHistory => _fetchingHistory;
  AppUser? get selectedRecipient => _selectedRecipient;
  bool get isWsConnected => _isWsConnected;

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

  void connectWebSocket(String wsUrl, {String? token}) {
    final uri = Uri.parse(wsUrl);
    final resolvedUrl = token == null || token.isEmpty
        ? uri.toString()
        : uri
            .replace(
              queryParameters: {
                ...uri.queryParameters,
                'token': token,
              },
            )
            .toString();

    if (_isWsConnected && _wsUrl == resolvedUrl) return;

    _wsUrl = resolvedUrl;
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    
    debugPrint('[ChatProvider] Connecting to WS: ${_redactToken(resolvedUrl)}');
    
    try {
      _channel = WebSocketChannel.connect(Uri.parse(resolvedUrl));
      _isWsConnected = true;
      notifyListeners();
      _channel!.stream.listen(
        (message) {
          debugPrint('[ChatProvider] WS Message Received: $message');
          final data = jsonDecode(message);
          if (data['event'] == 'chat_message') {
            final msg = ChatMessage.fromJson(data['data']);
            
            final isGeneral = msg.recipientId == null;
            final isForMe = isGeneral || msg.recipientId == _currentUserId;
            final isByMe = msg.senderId == _currentUserId;

            if (isForMe) {
              bool isCurrentlyViewingChat = false;
              if (_selectedRecipient == null) {
                isCurrentlyViewingChat = isGeneral;
              } else {
                isCurrentlyViewingChat = msg.senderId == _selectedRecipient!.id;
              }

              // Update messages locally
              if (_selectedRecipient == null) {
                if (isGeneral) {
                  _messages.add(msg);
                  if (!_isDisposed) notifyListeners();
                }
              } else {
                final isFromSelected = msg.senderId == _selectedRecipient!.id;
                final isToSelected = msg.recipientId == _selectedRecipient!.id;
                final isMe = msg.senderId == _currentUserId;

                if ((isMe && isToSelected) || (isFromSelected && isForMe)) {
                  _messages.add(msg);
                  if (!_isDisposed) notifyListeners();
                }
              }

              // Show in-app notification if we are not currently in the chat view with this sender
              if (!isByMe && !isCurrentlyViewingChat) {
                _showInAppNotification(msg);
              }
            }
          }
        },
        onError: (err) {
          debugPrint('[ChatProvider] WS Error: $err');
          _isWsConnected = false;
          notifyListeners();
          _scheduleReconnect();
        },
        onDone: () {
          debugPrint('[ChatProvider] WS Connection Closed');
          _isWsConnected = false;
          notifyListeners();
          _scheduleReconnect();
        },
      );
    } catch (e) {
      debugPrint('[ChatProvider] WS Connect Exception: $e');
      _isWsConnected = false;
      notifyListeners();
      _scheduleReconnect();
    }
  }

  void _showInAppNotification(ChatMessage msg) {
    final context = _navigatorKey?.currentContext;
    if (context != null) {
      final isGeneral = msg.recipientId == null;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          elevation: 4,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          backgroundColor: Theme.of(context).brightness == Brightness.dark 
              ? const Color(0xFF1F2937) 
              : Colors.white,
          duration: const Duration(seconds: 4),
          content: Row(
            children: [
              Icon(
                Icons.chat_bubble_outline_rounded,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      msg.senderName,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).brightness == Brightness.dark 
                            ? Colors.white 
                            : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      msg.content,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Theme.of(context).brightness == Brightness.dark 
                            ? Colors.white70 
                            : Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          action: SnackBarAction(
            label: 'Balas',
            textColor: Theme.of(context).colorScheme.primary,
            onPressed: () {
              final sender = _members.firstWhere(
                (m) => m.id == msg.senderId,
                orElse: () => AppUser(
                  id: msg.senderId,
                  username: '',
                  email: '',
                  fullName: msg.senderName,
                  role: msg.senderRole,
                ),
              );
              setSelectedRecipient(isGeneral ? null : sender);
              _navigatorKey!.currentState?.push(
                MaterialPageRoute(builder: (_) => const ChatDetailScreen()),
              );
            },
          ),
        ),
      );
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

  String _redactToken(String url) {
    final uri = Uri.parse(url);
    if (!uri.queryParameters.containsKey('token')) return url;
    return uri.replace(queryParameters: {
      ...uri.queryParameters,
      'token': '<redacted>',
    }).toString();
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
