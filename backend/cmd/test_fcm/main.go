package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

func main() {
	// Flag untuk token spesifik
	tokenFlag := flag.String("token", "", "Token FCM spesifik perangkat (opsional)")
	flag.Parse()

	// Coba load file .env dari folder backend atau parent
	_ = godotenv.Load() // coba directory saat ini
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	credFile := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if credFile == "" {
		credFile = "firebase-service-account.json"
	}

	// Cek keberadaan file
	if _, err := os.Stat(credFile); os.IsNotExist(err) {
		// Coba cari di parent directory jika dijalankan dari cmd/test_fcm
		parentPath := filepath.Join("..", "..", credFile)
		if _, errP := os.Stat(parentPath); errP == nil {
			credFile = parentPath
		} else {
			log.Fatalf("Error: File kredensial Firebase '%s' tidak ditemukan. Pastikan file tersebut ada di folder backend Anda.", credFile)
		}
	}

	fmt.Printf("Membaca file kredensial Firebase: %s\n", credFile)

	ctx := context.Background()
	opt := option.WithCredentialsFile(credFile)
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("Gagal inisialisasi Firebase App: %v", err)
	}

	client, err := app.Messaging(ctx)
	if err != nil {
		log.Fatalf("Gagal membuat FCM Messaging client: %v", err)
	}

	title := "🔔 Tes Koneksi FCM VisioBin"
	body := "Selamat! Laptop Anda berhasil terhubung ke Firebase dan mengirim notifikasi push ke aplikasi mobile."

	data := map[string]string{
		"alert_type": "system_test",
		"severity":   "info",
		"screen":     "dashboard",
		"bin_name":   "Semua Tempat Sampah",
	}

	var msg *messaging.Message

	if *tokenFlag != "" {
		fmt.Printf("Mengirim notifikasi khusus ke token perangkat: %s...\n", *tokenFlag)
		msg = &messaging.Message{
			Token: *tokenFlag,
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
	} else {
		topic := "visiobin_alerts"
		fmt.Printf("Mengirim broadcast notifikasi ke topik FCM '%s'...\n", topic)
		msg = &messaging.Message{
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
	}

	response, err := client.Send(ctx, msg)
	if err != nil {
		log.Fatalf("❌ Gagal mengirim notifikasi FCM: %v\n\nTips: Periksa apakah 'project_id' atau private key di firebase-service-account.json Anda valid dan tidak kedaluwarsa.", err)
	}

	fmt.Println("==================================================")
	fmt.Println("✅ NOTIFIKASI BERHASIL DIKIRIM KE FIREBASE SERVERS")
	fmt.Printf("Message ID: %s\n", response)
	if *tokenFlag == "" {
		fmt.Println("Catatan: Notifikasi dikirim sebagai broadcast ke topik 'visiobin_alerts'.")
		fmt.Println("Semua perangkat mobile yang terhubung dan aktif akan menerima pesan ini.")
	} else {
		fmt.Println("Catatan: Notifikasi dikirim langsung ke target perangkat spesifik.")
	}
	fmt.Println("==================================================")
}
