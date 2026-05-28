import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_id.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('id'),
  ];

  /// Label for the dashboard screen
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboard;

  /// Label for the map screen
  ///
  /// In en, this message translates to:
  /// **'Map'**
  String get map;

  /// Label for the settings screen
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// Label for the notifications screen
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// Label for the profile screen
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// Label for the logout button
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// Label for the home screen
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// Label for the history screen
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get history;

  /// Label for the maintenance screen
  ///
  /// In en, this message translates to:
  /// **'Repair'**
  String get repair;

  /// Label for the chat screen
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get chat;

  /// Label for the language selection
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @offlineModeLastData.
  ///
  /// In en, this message translates to:
  /// **'Offline Mode - Showing Last Data'**
  String get offlineModeLastData;

  /// No description provided for @systemStatus.
  ///
  /// In en, this message translates to:
  /// **'System Status'**
  String get systemStatus;

  /// No description provided for @liveCamera.
  ///
  /// In en, this message translates to:
  /// **'Live Camera'**
  String get liveCamera;

  /// No description provided for @open.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get open;

  /// No description provided for @realTimeCapacity.
  ///
  /// In en, this message translates to:
  /// **'Real-time Capacity'**
  String get realTimeCapacity;

  /// No description provided for @weeklyScanAnalytics.
  ///
  /// In en, this message translates to:
  /// **'Weekly Scan Analytics'**
  String get weeklyScanAnalytics;

  /// No description provided for @quickActions.
  ///
  /// In en, this message translates to:
  /// **'Quick Actions'**
  String get quickActions;

  /// No description provided for @recentActivity.
  ///
  /// In en, this message translates to:
  /// **'Recent Activity'**
  String get recentActivity;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View All'**
  String get viewAll;

  /// No description provided for @openFullVideoStream.
  ///
  /// In en, this message translates to:
  /// **'Open Full Video Stream'**
  String get openFullVideoStream;

  /// No description provided for @scanBin.
  ///
  /// In en, this message translates to:
  /// **'Scan Bin'**
  String get scanBin;

  /// No description provided for @reportIssue.
  ///
  /// In en, this message translates to:
  /// **'Report'**
  String get reportIssue;

  /// No description provided for @navigateToBin.
  ///
  /// In en, this message translates to:
  /// **'Navigate'**
  String get navigateToBin;

  /// No description provided for @syncOffline.
  ///
  /// In en, this message translates to:
  /// **'Sync'**
  String get syncOffline;

  /// No description provided for @scanBinOpened.
  ///
  /// In en, this message translates to:
  /// **'Camera opened for scan validation.'**
  String get scanBinOpened;

  /// No description provided for @reportIssuePrompt.
  ///
  /// In en, this message translates to:
  /// **'Record physical bin issues from the maintenance menu.'**
  String get reportIssuePrompt;

  /// No description provided for @navigationPrompt.
  ///
  /// In en, this message translates to:
  /// **'Open the map to choose a unit and pickup route.'**
  String get navigationPrompt;

  /// No description provided for @syncComplete.
  ///
  /// In en, this message translates to:
  /// **'Dashboard data synced successfully.'**
  String get syncComplete;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'id'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'id':
      return AppLocalizationsId();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
