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

class _ChatScreenState extends State<ChatScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final chatProvider = context.read<ChatProvider>();
      final dashboardProvider = context.read<DashboardProvider>();
      
      // Sangat Penting: Beritahu sistem chat siapa user saat ini agar filter real-time jalan
      chatProvider.setCurrentUserId(dashboardProvider.currentUser?.id);
      
      chatProvider.fetchMembers();
      
      // Connect WS in background for notifications if needed, 
      // but the detail page will also ensure connection
      final apiBaseUrl = chatProvider.apiService.baseUrl;
      final wsUrl = apiBaseUrl.replaceAll('http', 'ws').replaceAll('/api/v1', '/ws');
      chatProvider.connectWebSocket(wsUrl);
    });
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = context.watch<ChatProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF111827) : const Color(0xFFF3F4F6),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Diskusi Tim',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Pilih saluran atau rekan tim untuk mulai chat',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                children: [
                  _buildSectionHeader('SALURAN UTAMA'),
                  const SizedBox(height: 12),
                  _buildChatTile(
                    context,
                    title: 'General Channel',
                    subtitle: 'Diskusi publik untuk semua anggota',
                    icon: LucideIcons.hash,
                    onTap: () => _navigateToDetail(context, null),
                    isDark: isDark,
                    primaryColor: primaryColor,
                  ),
                  const SizedBox(height: 32),
                  _buildSectionHeader('ANGGOTA TIM'),
                  const SizedBox(height: 12),
                  if (chatProvider.members.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                    )
                  else
                    ...chatProvider.members
                        .where((m) => m.id != context.read<DashboardProvider>().currentUser?.id)
                        .map((member) => _buildChatTile(
                              context,
                              title: member.fullName,
                              subtitle: member.role,
                              initial: member.fullName[0],
                              onTap: () => _navigateToDetail(context, member),
                              isDark: isDark,
                              primaryColor: primaryColor,
                            )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: Colors.grey,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildChatTile(
    BuildContext context, {
    required String title,
    required String subtitle,
    IconData? icon,
    String? initial,
    required VoidCallback onTap,
    required bool isDark,
    required Color primaryColor,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white10 : Colors.white),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          radius: 24,
          backgroundColor: primaryColor.withOpacity(0.1),
          child: icon != null
              ? Icon(icon, size: 20, color: primaryColor)
              : Text(
                  initial ?? '',
                  style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 18),
                ),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 13, color: Colors.grey)),
        trailing: const Icon(LucideIcons.chevronRight, size: 18, color: Colors.grey),
      ),
    );
  }

  void _navigateToDetail(BuildContext context, AppUser? recipient) {
    final chatProvider = context.read<ChatProvider>();
    chatProvider.setSelectedRecipient(recipient);
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ChatDetailScreen(),
      ),
    );
  }
}

class ChatDetailScreen extends StatefulWidget {
  const ChatDetailScreen({super.key});

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ChatProvider>();
      provider.fetchHistory();
      
      // Pasang listener: Jika ada pesan baru (dari WS), scroll ke bawah otomatis
      provider.addListener(_onProviderUpdate);
    });
  }

  void _onProviderUpdate() {
    if (mounted) {
      // Berikan sedikit delay agar UI selesai merender pesan baru sebelum scroll
      Future.delayed(const Duration(milliseconds: 300), _scrollToBottom);
    }
  }

  @override
  void dispose() {
    // Penting: Lepas listener saat keluar halaman agar tidak memory leak
    context.read<ChatProvider>().removeListener(_onProviderUpdate);
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = context.watch<ChatProvider>();
    final currentUser = context.read<DashboardProvider>().currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;
    final recipient = chatProvider.selectedRecipient;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF111827) : const Color(0xFFF3F4F6),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
        elevation: 0,
        centerTitle: false,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: isDark ? Colors.white : Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              recipient?.fullName ?? 'General Channel',
              style: TextStyle(
                fontSize: 16, 
                fontWeight: FontWeight.w800, 
                color: isDark ? Colors.white : Colors.black87
              ),
            ),
            Text(
              recipient != null ? recipient.role : 'Grup Terbuka',
              style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: chatProvider.fetchingHistory
                ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                : _buildMessagesList(chatProvider, currentUser, isDark, primaryColor),
          ),
          _buildInputArea(chatProvider, primaryColor, isDark),
        ],
      ),
    );
  }

  Widget _buildMessagesList(ChatProvider provider, AppUser? currentUser, bool isDark, Color primaryColor) {
    if (provider.messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.messageSquare, size: 48, color: Colors.grey.withOpacity(0.2)),
            const SizedBox(height: 16),
            const Text('Belum ada pesan', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      itemCount: provider.messages.length,
      itemBuilder: (context, index) {
        final msg = provider.messages[index];
        final isMe = msg.senderId == currentUser?.id;

        return Padding(
          padding: const EdgeInsets.only(bottom: 18.0),
          child: Column(
            crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              if (!isMe)
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 6),
                  child: Text(
                    msg.senderName, 
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.grey)
                  ),
                ),
              Container(
                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isMe ? primaryColor : (isDark ? const Color(0xFF1F2937) : Colors.white),
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(18),
                    topRight: const Radius.circular(18),
                    bottomLeft: Radius.circular(isMe ? 18 : 4),
                    bottomRight: Radius.circular(isMe ? 4 : 18),
                  ),
                ),
                child: Text(
                  msg.content,
                  style: TextStyle(
                    color: isMe ? Colors.white : (isDark ? Colors.white : Colors.black87), 
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 4, right: 4),
                child: Text(
                  DateFormat('HH:mm').format(msg.createdAt), 
                  style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500)
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInputArea(ChatProvider provider, Color primaryColor, bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        border: Border(top: BorderSide(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF111827) : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: TextField(
                controller: _messageController,
                style: const TextStyle(fontSize: 15),
                decoration: const InputDecoration(
                  hintText: 'Tulis pesan...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(fontSize: 14, color: Colors.grey),
                  contentPadding: EdgeInsets.symmetric(vertical: 14),
                ),
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () async {
              final text = _messageController.text.trim();
              if (text.isEmpty) return;
              _messageController.clear();
              final success = await provider.sendMessage(text);
              if (success) {
                Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
              }
            },
            child: Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: primaryColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(LucideIcons.send, size: 20, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
