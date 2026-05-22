// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:visiobin/main.dart';

void main() {
  testWidgets('VisioBin app smoke test', (WidgetTester tester) async {
    dotenv.loadFromString(
      envString: '''
API_BASE_URL=test-api-base-url
WS_BASE_URL=test-ws-base-url
CAMERA_STREAM_URL=test-camera-stream-url
''',
    );

    // Build our app and trigger a frame.
    await tester.pumpWidget(const VisioBinApp());

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
