import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/chat_provider.dart';
import '../providers/dashboard_provider.dart';
import '../models/models.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _showMembers = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final chatProvider = context.read<ChatProvider>();
      final dashboardProvider = context.read<DashboardProvider>();
      
      // Set current user ID for filtering
      chatProvider.setCurrentUserId(dashboardProvider.currentUser?.id);
      
      // Connect WS
      final apiBaseUrl = chatProvider.apiService.baseUrl;
      final wsUrl = apiBaseUrl.replaceAll('http', 'ws').replaceAll('/api/v1', '/ws');
      chatProvider.connectWebSocket(wsUrl);
      
      // Initial fetch
      chatProvider.fetchHistory();
      chatProvider.fetchMembers();
    });
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = context.watch<ChatProvider>();
    final currentUser = context.read<DashboardProvider>().currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              chatProvider.selectedRecipient?.fullName ?? 'Diskusi Tim General',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              chatProvider.selectedRecipient != null 
                ? 'Chat pribadi dengan ${chatProvider.selectedRecipient!.role}'
                : '${chatProvider.members.length} anggota terhubung',
              style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.primary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(_showMembers ? LucideIcons.messageSquare : LucideIcons.users),
            onPressed: () => setState(() => _showMembers = !_showMembers),
          ),
          if (chatProvider.selectedRecipient != null)
            IconButton(
              icon: const Icon(LucideIcons.hash),
              onPressed: () => chatProvider.setSelectedRecipient(null),
              tooltip: 'Kembali ke General',
            ),
        ],
      ),
      body: _showMembers ? _buildMembersList(chatProvider) : _buildChatArea(chatProvider, currentUser, isDark),
    );
  }

  Widget _buildMembersList(ChatProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'ANGGOTA TIM',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
        ),
        ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.green.withValues(alpha: 0.1),
            child: const Icon(LucideIcons.hash, size: 18, color: Colors.green),
          ),
          title: const Text('General Channel', style: TextStyle(fontWeight: FontWeight.bold)),
          subtitle: const Text('Diskusi tim publik'),
          selected: provider.selectedRecipient == null,
          onTap: () {
            provider.setSelectedRecipient(null);
            setState(() => _showMembers = false);
          },
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Text(
            'PESAN LANGSUNG',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: provider.members.length,
            itemBuilder: (context, index) {
              final member = provider.members[index];
              if (member.id == context.read<DashboardProvider>().currentUser?.id) {
                return const SizedBox.shrink();
              }
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: Text(member.fullName[0].toUpperCase()),
                ),
                title: Text(member.fullName),
                subtitle: Text(member.role, style: const TextStyle(fontSize: 12)),
                selected: provider.selectedRecipient?.id == member.id,
                onTap: () {
                  provider.setSelectedRecipient(member);
                  setState(() => _showMembers = false);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildChatArea(ChatProvider provider, AppUser? currentUser, bool isDark) {
    return Column(
      children: [
        Expanded(
          child: provider.fetchingHistory
              ? const Center(child: Loader2(size: 24))
              : _buildMessagesList(provider, currentUser, isDark),
        ),
        _buildInputArea(provider),
      ],
    );
  }

  Widget _buildMessagesList(ChatProvider provider, AppUser? currentUser, bool isDark) {
    if (provider.messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.messageCircle, size: 48, color: Colors.grey.withValues(alpha: 0.5)),
            const SizedBox(height: 16),
            Text(
              provider.selectedRecipient != null
                  ? 'Mulai percakapan pribadi dengan ${provider.selectedRecipient!.fullName}'
                  : 'Belum ada pesan dalam diskusi ini',
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: provider.messages.length,
      itemBuilder: (context, index) {
        final msg = provider.messages[index];
        final isMe = msg.senderId == currentUser?.id;
        
        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: Column(
            crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              if (!isMe)
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 4),
                  child: Text(
                    msg.senderName,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isMe 
                      ? Theme.of(context).colorScheme.primary 
                      : (isDark ? Colors.grey[800] : Colors.grey[200]),
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(16),
                    topRight: const Radius.circular(16),
                    bottomLeft: Radius.circular(isMe ? 16 : 4),
                    bottomRight: Radius.circular(isMe ? 4 : 16),
                  ),
                ),
                child: Text(
                  msg.content,
                  style: TextStyle(
                    color: isMe ? Colors.white : (isDark ? Colors.white : Colors.black87),
                    fontSize: 14,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 4, left: 4, right: 4),
                child: Text(
                  DateFormat('HH:mm').format(msg.createdAt),
                  style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInputArea(ChatProvider provider) {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 8, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        border: Border(top: BorderSide(color: Colors.grey.withValues(alpha: 0.2))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark 
                    ? Colors.grey[900] 
                    : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
              ),
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: provider.selectedRecipient != null 
                    ? 'Pesan ke ${provider.selectedRecipient!.fullName}...'
                    : 'Ketik pesan...',
                  border: InputBorder.none,
                  hintStyle: const TextStyle(fontSize: 14),
                ),
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
              ),
            ),
          ),
          const SizedBox(width: 12),
          CircleAvatar(
            backgroundColor: Theme.of(context).colorScheme.primary,
            child: IconButton(
              icon: const Icon(LucideIcons.send, size: 18, color: Colors.white),
              onPressed: () async {
                final text = _messageController.text.trim();
                if (text.isEmpty) return;
                _messageController.clear();
                await provider.sendMessage(text);
                _scrollToBottom();
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}

class Loader2 extends StatelessWidget {
  final double size;
  const Loader2({super.key, this.size = 20});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary),
      ),
    );
  }
}
