import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'providers/dashboard_provider.dart';
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
  } catch (e) {
    debugPrint("Firebase initialization error (might missing google-services.json): $e");
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

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _dashboardProvider = DashboardProvider(_apiService);
    _setupPushNotifications();
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

      // Handler saat notifikasi diklik (ketika aplikasi dibuka dari notifikasi)
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
    return ChangeNotifierProvider.value(
      value: _dashboardProvider,
      child: MaterialApp(
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
        home: Consumer<DashboardProvider>(
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
