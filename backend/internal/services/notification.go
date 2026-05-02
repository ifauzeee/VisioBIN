package services

import (
	"context"
	"fmt"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"

	"github.com/ifauze/visiobin/internal/repository"
)

// NotificationService menangani pengiriman push notification via Firebase FCM.
// Jika Firebase tidak dikonfigurasi (GOOGLE_APPLICATION_CREDENTIALS tidak di-set),
// service ini berjalan dalam mode "no-op" (tidak mengirim notifikasi tapi tidak error).
type NotificationService struct {
	client  *messaging.Client
	enabled bool
}

// NewNotificationService inisialisasi FCM client dari service account JSON.
// Cara konfigurasi (pilih salah satu):
//
//  1. File JSON (recommended):
//     export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
//
//  2. Inline via env var FCM_CREDENTIALS_JSON:
//     export FCM_CREDENTIALS_JSON='{"type":"service_account",...}'
func NewNotificationService() *NotificationService {
	svc := &NotificationService{enabled: false}

	credJSON := os.Getenv("FCM_CREDENTIALS_JSON")
	credFile := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")

	if credJSON == "" && credFile == "" {
		log.Println("[FCM] Tidak dikonfigurasi (GOOGLE_APPLICATION_CREDENTIALS tidak di-set). Push notification dinonaktifkan.")
		return svc
	}

	ctx := context.Background()
	var app *firebase.App
	var err error

	if credJSON != "" {
		// Inisialisasi dari JSON string (untuk Docker/Kubernetes)
		opt := option.WithCredentialsJSON([]byte(credJSON))
		app, err = firebase.NewApp(ctx, nil, opt)
	} else {
		// Inisialisasi dari file JSON
		opt := option.WithCredentialsFile(credFile)
		app, err = firebase.NewApp(ctx, nil, opt)
	}

	if err != nil {
		log.Printf("[FCM] Gagal inisialisasi Firebase app: %v. Push notification dinonaktifkan.", err)
		return svc
	}

	client, err := app.Messaging(ctx)
	if err != nil {
		log.Printf("[FCM] Gagal membuat messaging client: %v. Push notification dinonaktifkan.", err)
		return svc
	}

	svc.client  = client
	svc.enabled = true
	log.Println("[FCM] ✅ Firebase Messaging aktif")
	return svc
}

// IsEnabled mengembalikan true jika FCM berhasil dikonfigurasi.
func (s *NotificationService) IsEnabled() bool {
	return s.enabled
}

// SendToToken mengirim notifikasi ke satu FCM token perangkat.
func (s *NotificationService) SendToToken(ctx context.Context, token, title, body string, data map[string]string) error {
	if !s.enabled {
		log.Printf("[FCM-NOOP] → %s: %s", title, body)
		return nil
	}

	badgeCount := 1

	msg := &messaging.Message{
		Token: token,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				Title:       title,
				Body:        body,
				ChannelID:   "visiobin_alerts",
				Icon:        "ic_notification",
				Color:       "#2ED573",
				ClickAction: "FLUTTER_NOTIFICATION_CLICK",
			},
		},
		APNS: &messaging.APNSConfig{
			Payload: &messaging.APNSPayload{
				Aps: &messaging.Aps{
					Alert: &messaging.ApsAlert{
						Title: title,
						Body:  body,
					},
					Sound: "default",
					Badge: &badgeCount,
				},
			},
		},
		Data: data,
	}

	_, err := s.client.Send(ctx, msg)
	if err != nil {
		return fmt.Errorf("FCM send failed: %w", err)
	}
	return nil
}

// SendToTopic mengirim notifikasi ke sebuah topic FCM (broadcast ke semua subscriber).
func (s *NotificationService) SendToTopic(ctx context.Context, topic, title, body string, data map[string]string) error {
	if !s.enabled {
		log.Printf("[FCM-NOOP] Topic/%s → %s: %s", topic, title, body)
		return nil
	}

	msg := &messaging.Message{
		Topic: topic,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				Title:     title,
				Body:      body,
				ChannelID: "visiobin_alerts",
			},
		},
		Data: data,
	}

	_, err := s.client.Send(ctx, msg)
	if err != nil {
		return fmt.Errorf("FCM topic send failed: %w", err)
	}
	return nil
}

// NotifyVolumeAlert mengirim notifikasi alert volume ke semua petugas terdaftar.
// Menggunakan topic "visiobin_alerts" agar semua petugas yang subscribe menerima.
func (s *NotificationService) NotifyVolumeAlert(
	ctx context.Context,
	userRepo *repository.UserRepository,
	binID, binName, alertType, severity string,
	volumePct float64,
) {
	var title, body string
	icon := "🗑️"

	switch severity {
	case "critical":
		icon = "🚨"
		title = fmt.Sprintf("%s %s — Kritis!", icon, binName)
		body  = fmt.Sprintf("Volume sudah %.0f%%. Segera kosongkan!", volumePct)
	case "warning":
		icon = "⚠️"
		title = fmt.Sprintf("%s %s — Peringatan", icon, binName)
		body  = fmt.Sprintf("Volume mencapai %.0f%%. Persiapkan pengangkutan.", volumePct)
	default:
		title = fmt.Sprintf("%s %s", icon, binName)
		body  = fmt.Sprintf("Volume: %.0f%%", volumePct)
	}

	data := map[string]string{
		"bin_id":     binID,
		"alert_type": alertType,
		"volume":     fmt.Sprintf("%.1f", volumePct),
		"severity":   severity,
		"screen":     "dashboard",
	}

	// Broadcast ke topic (semua petugas yang subscribe)
	if err := s.SendToTopic(ctx, "visiobin_alerts", title, body, data); err != nil {
		log.Printf("[FCM] Error kirim topic alert: %v", err)
	}

	// Kirim juga ke individual token (jika ada user terdaftar)
	if userRepo != nil {
		tokens, err := userRepo.GetAllFCMTokens(ctx)
		if err != nil {
			log.Printf("[FCM] Error ambil FCM tokens: %v", err)
			return
		}
		for _, token := range tokens {
			if token == "" {
				continue
			}
			if err := s.SendToToken(ctx, token, title, body, data); err != nil {
				log.Printf("[FCM] Error kirim ke token: %v", err)
			}
		}
		if len(tokens) > 0 {
			log.Printf("[FCM] ✅ Notifikasi terkirim ke %d perangkat", len(tokens))
		}
	}
}

// NotifyGasAlert mengirim notifikasi khusus deteksi gas amonia.
func (s *NotificationService) NotifyGasAlert(
	ctx context.Context,
	binID, binName string,
	gasPpm float64,
) {
	var title, body string

	if gasPpm >= 50 {
		title = fmt.Sprintf("☠️ %s — Gas Amonia Bahaya!", binName)
		body  = fmt.Sprintf("Konsentrasi NH3: %.1f ppm (>50 ppm). Periksa segera!", gasPpm)
	} else {
		title = fmt.Sprintf("😷 %s — Gas Amonia Tinggi", binName)
		body  = fmt.Sprintf("Konsentrasi NH3: %.1f ppm. Sampah organik mulai membusuk.", gasPpm)
	}

	data := map[string]string{
		"bin_id":   binID,
		"alert_type": "gas",
		"gas_ppm":  fmt.Sprintf("%.1f", gasPpm),
		"screen":   "dashboard",
	}

	if err := s.SendToTopic(ctx, "visiobin_alerts", title, body, data); err != nil {
		log.Printf("[FCM] Error kirim gas alert: %v", err)
	}
}
