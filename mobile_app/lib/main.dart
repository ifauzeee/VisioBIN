import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'services/api_service.dart';
import 'providers/dashboard_provider.dart';
import 'providers/maintenance_provider.dart';
import 'providers/chat_provider.dart';
import 'screens/main_screen.dart';
import 'screens/login_screen.dart';

// Menangkap notifikasi saat aplikasi berjalan di background/terminated
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inisialisasi Firebase
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // Load .env configuration
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint("Initialization error: $e");
  }

  runApp(const VisioBinApp());
}

class VisioBinApp extends StatefulWidget {
  const VisioBinApp({super.key});

  @override
  State<VisioBinApp> createState() => _VisioBinAppState();
}

class _VisioBinAppState extends State<VisioBinApp> {
  late final ApiService _apiService;
  late final DashboardProvider _dashboardProvider;

  late final MaintenanceProvider _maintenanceProvider;
  late final ChatProvider _chatProvider;
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  bool _isCheckingAuth = true;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _dashboardProvider = DashboardProvider(_apiService);
    _maintenanceProvider = MaintenanceProvider(_apiService);
    _chatProvider = ChatProvider(_apiService);
    _checkAuth();
    _setupPushNotifications();
  }

  Future<void> _checkAuth() async {
    await _apiService.loadStoredSession();
    if (_apiService.isAuthenticated) {
      _dashboardProvider.initializeFromStorage();
    }
    if (mounted) {
      setState(() {
        _isCheckingAuth = false;
      });
    }
  }

  Future<void> _setupPushNotifications() async {
    try {
      FirebaseMessaging messaging = FirebaseMessaging.instance;

      // Meminta izin notifikasi (diperlukan untuk iOS dan Android 13+)
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('User granted notification permission');
        
        // Subscribe ke topik 'visiobin_alerts' agar menerima broadcast dari backend
        await messaging.subscribeToTopic('visiobin_alerts');
        debugPrint('Subscribed to topic: visiobin_alerts');

        // (Opsional) Ambil token spesifik device jika backend perlu kirim private push
        String? token = await messaging.getToken();
        debugPrint('FCM Token: $token');

        // Send FCM token to backend if authenticated
        if (token != null && _apiService.isAuthenticated) {
          await _apiService.updateFcmToken(token);
        }
        
      } else {
        debugPrint('User declined or has not accepted permission');
      }

      // Handler saat notifikasi diterima saat aplikasi sedang terbuka (foreground)
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Menerima notifikasi foreground: ${message.notification?.title}');
        final context = _navigatorKey.currentContext;
        if (context != null && message.notification != null) {
          final String title = message.notification!.title ?? 'Notifikasi Baru';
          final String body = message.notification!.body ?? '';
          final String? location = message.data['location'];
          final String? severity = message.data['severity'];

          Color accentColor = const Color(0xFF10b981); // Default green
          IconData icon = Icons.notifications_active;

          if (severity == 'critical') {
            accentColor = Colors.redAccent;
            icon = Icons.warning_rounded;
          } else if (severity == 'warning') {
            accentColor = Colors.orangeAccent;
            icon = Icons.info_outline_rounded;
          }

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              elevation: 0,
              backgroundColor: Colors.transparent,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 6),
              content: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark 
                      ? const Color(0xFF1F2937).withOpacity(0.9)
                      : Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: accentColor.withOpacity(0.5),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: accentColor.withOpacity(0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: accentColor.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: accentColor, size: 24),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: Theme.of(context).brightness == Brightness.dark 
                                  ? Colors.white 
                                  : const Color(0xFF111827),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            body,
                            style: TextStyle(
                              fontSize: 13,
                              color: Theme.of(context).brightness == Brightness.dark 
                                  ? Colors.white70 
                                  : Colors.black87,
                            ),
                          ),
                          if (location != null && location.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Icon(
                                  Icons.location_on_outlined, 
                                  size: 14, 
                                  color: accentColor
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  location,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: accentColor,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).hideCurrentSnackBar();
                      },
                      icon: const Icon(Icons.close, size: 18),
                      color: Colors.grey,
                    ),
                  ],
                ),
              ),
            ),
          );
        }
      });

      // Handler saat notifikasi diklik (ketika aplikasi dibuka dari background)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('A new onMessageOpenedApp event was published!');
        if (message.data['screen'] == 'dashboard') {
          // Navigasi ke dashboard bisa ditambahkan di sini via Router/NavigatorKey
        }
      });
      
    } catch (e) {
      debugPrint("FCM Setup Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _dashboardProvider),
        ChangeNotifierProvider.value(value: _maintenanceProvider),
        ChangeNotifierProvider.value(value: _chatProvider),
      ],
      child: MaterialApp(
        navigatorKey: _navigatorKey,
        title: 'VisioBin',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF10b981), // Emerald green
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          textTheme: GoogleFonts.outfitTextTheme(Theme.of(context).textTheme).copyWith(
            titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold),
            headlineMedium: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          ),
          scaffoldBackgroundColor: const Color(0xFFF3F4F6),
        ),
        darkTheme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF10b981),
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
          textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
            titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold),
            headlineMedium: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          ),
          scaffoldBackgroundColor: const Color(0xFF111827),
        ),
        themeMode: ThemeMode.system,
        home: _isCheckingAuth
            ? const Scaffold(body: Center(child: CircularProgressIndicator()))
            : Consumer<DashboardProvider>(
                builder: (context, provider, _) {
                  if (provider.isAuthenticated) {
                    return const MainScreen();
                  }
                  return const LoginScreen();
                },
              ),
      ),
    );
  }
}

