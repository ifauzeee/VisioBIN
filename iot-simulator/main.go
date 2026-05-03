package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"time"
)

const defaultBaseURL = "http://localhost:8080/api/v1"

type TelemetryPayload struct {
	BinID               string  `json:"bin_id"`
	DistanceOrganicCm   float64 `json:"distance_organic_cm"`
	DistanceInorganicCm float64 `json:"distance_inorganic_cm"`
	WeightOrganicKg     float64 `json:"weight_organic_kg"`
	WeightInorganicKg   float64 `json:"weight_inorganic_kg"`
	GasAmoniaPpm        float64 `json:"gas_amonia_ppm"`
}

type ClassificationPayload struct {
	BinID           string  `json:"bin_id"`
	PredictedClass  string  `json:"predicted_class"`
	Confidence      float64 `json:"confidence"`
	InferenceTimeMs int     `json:"inference_time_ms"`
}

type BinSimulator struct {
	BinID             string
	BinName           string
	DistanceOrganic   float64
	DistanceInorganic float64
	WeightOrganic     float64
	WeightInorganic   float64
	GasAmonia         float64
	CycleCount        int
	IsPeakHour        bool
}

func NewBinSimulator(binID, binName string) *BinSimulator {
	return &BinSimulator{
		BinID:             binID,
		BinName:           binName,
		DistanceOrganic:   48.0,
		DistanceInorganic: 49.0,
		WeightOrganic:     0.1,
		WeightInorganic:   0.05,
		GasAmonia:         3.0,
	}
}

func (s *BinSimulator) Update() {
	s.CycleCount++

	hour := time.Now().Hour()
	s.IsPeakHour = hour >= 9 && hour <= 16

	fillMultiplier := 0.8
	if s.IsPeakHour {
		fillMultiplier = 1.5
	}

	s.DistanceOrganic -= (0.3 + rand.Float64()*1.2) * fillMultiplier
	s.DistanceInorganic -= (0.2 + rand.Float64()*0.8) * fillMultiplier
	s.WeightOrganic += (0.02 + rand.Float64()*0.13) * fillMultiplier
	s.WeightInorganic += (0.01 + rand.Float64()*0.07) * fillMultiplier
	s.GasAmonia += (0.05 + rand.Float64()*0.35)

	s.DistanceOrganic += (-0.2 + rand.Float64()*0.3)
	s.DistanceInorganic += (-0.1 + rand.Float64()*0.2)
	s.GasAmonia += (-0.1 + rand.Float64()*0.15)

	s.DistanceOrganic = clamp(s.DistanceOrganic, 2.0, 50.0)
	s.DistanceInorganic = clamp(s.DistanceInorganic, 2.0, 50.0)
	s.WeightOrganic = clamp(s.WeightOrganic, 0.0, 20.0)
	s.WeightInorganic = clamp(s.WeightInorganic, 0.0, 20.0)
	s.GasAmonia = clamp(s.GasAmonia, 1.0, 200.0)

	volOrganic := ((50.0 - s.DistanceOrganic) / 50.0) * 100
	if volOrganic > 90 && rand.Float64() > 0.6 {
		s.simulateCollection()
	}
}

func (s *BinSimulator) simulateCollection() {
	fmt.Printf("   🚛 [%s] PENGANGKUTAN! Volume direset.\n", s.BinName)
	s.DistanceOrganic = 45.0 + rand.Float64()*4.0
	s.DistanceInorganic = 46.0 + rand.Float64()*3.0
	s.WeightOrganic = 0.05 + rand.Float64()*0.25
	s.WeightInorganic = 0.02 + rand.Float64()*0.13
	s.GasAmonia = 2.0 + rand.Float64()*3.0
}

func (s *BinSimulator) GetTelemetry() TelemetryPayload {
	return TelemetryPayload{
		BinID:               s.BinID,
		DistanceOrganicCm:   s.DistanceOrganic,
		DistanceInorganicCm: s.DistanceInorganic,
		WeightOrganicKg:     s.WeightOrganic,
		WeightInorganicKg:   s.WeightInorganic,
		GasAmoniaPpm:        s.GasAmonia,
	}
}

func (s *BinSimulator) GetVolumePcts() (float64, float64) {
	volO := ((50.0 - s.DistanceOrganic) / 50.0) * 100
	volI := ((50.0 - s.DistanceInorganic) / 50.0) * 100
	return max(0, volO), max(0, volI)
}

func clamp(val, minVal, maxVal float64) float64 {
	if val < minVal {
		return minVal
	}
	if val > maxVal {
		return maxVal
	}
	return val
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func main() {
	intervalPtr := flag.Int("interval", 10, "Seconds between readings")
	fastPtr := flag.Bool("fast", false, "Fast mode: 2 second interval")
	urlPtr := flag.String("url", defaultBaseURL, "Backend API base URL")
	userPtr := flag.String("user", "", "Username for authentication (required)")
	passPtr := flag.String("pass", "", "Password for authentication (required)")
	scenarioPtr := flag.String("scenario", "default", "Scenario: default, full-bin, gas-spike")
	flag.Parse()

	if *userPtr == "" || *passPtr == "" {
		fmt.Println("❌ Error: Username (-user) and Password (-pass) are required.")
		flag.Usage()
		return
	}

	interval := *intervalPtr
	if *fastPtr {
		interval = 2
	}
	baseURL := *urlPtr

	fmt.Println("============================================================")
	fmt.Println("🗑️  VisioBin IoT Simulator")
	fmt.Println("============================================================")
	fmt.Printf("   API URL   : %s\n", baseURL)
	fmt.Printf("   Interval  : %ds\n", interval)
	fmt.Printf("   Scenario  : %s\n\n", *scenarioPtr)

	client := &http.Client{Timeout: 5 * time.Second}

	var token string
	// ... login logic ...
	for {
		fmt.Println("🔑 Logging in...")
		loginBody := map[string]string{"username": *userPtr, "password": *passPtr}
		loginJSON, _ := json.Marshal(loginBody)

		resp, err := client.Post(baseURL+"/auth/login", "application/json", bytes.NewBuffer(loginJSON))
		if err != nil {
			fmt.Printf("   ❌ Backend unreachable: %v. Retrying in 3s...\n", err)
			time.Sleep(3 * time.Second)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			fmt.Printf("   ❌ Login failed (Status: %d). If you deleted the user, the simulator will stop.\n", resp.StatusCode)
			return
		}

		var result map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&result)
		resp.Body.Close()

		if err == nil && result["success"] == true {
			data, _ := result["data"].(map[string]interface{})
			token = data["token"].(string)
			fmt.Println("   🔓 Login successful!")
			break
		}

		fmt.Println("   ❌ Login failed, retrying in 3s...")
		time.Sleep(3 * time.Second)
	}

	fmt.Println("📡 Fetching bins from API...")
	req, _ := http.NewRequest("GET", baseURL+"/bins", nil)
	req.Header.Add("Authorization", "Bearer "+token)

	var binsData []interface{}
	for {
		resp, err := client.Do(req)
		if err != nil {
			fmt.Println("   ❌ Error fetching bins, retrying...")
			time.Sleep(2 * time.Second)
			continue
		}

		var binsResult map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&binsResult)
		resp.Body.Close()

		if data, ok := binsResult["data"].([]interface{}); ok {
			binsData = data
			break
		}
		fmt.Println("   ❌ No bins data found, retrying...")
		time.Sleep(2 * time.Second)
	}

	if len(binsData) == 0 {
		fmt.Println("❌ No bins found!")
		return
	}

	fmt.Printf("✅ Found %d bins:\n", len(binsData))
	var simulators []*BinSimulator
	for _, b := range binsData {
		bin := b.(map[string]interface{})
		id := bin["id"].(string)
		name := bin["name"].(string)
		fmt.Printf("   - %s (%s...)\n", name, id[:8])
		simulators = append(simulators, NewBinSimulator(id, name))
	}

	fmt.Println("\n▶️  Starting simulation (Ctrl+C to stop)")
	fmt.Println("------------------------------------------------------------")

	cycle := 0
	for {
		cycle++
		fmt.Printf("\n⏱️  Cycle #%d [%s]\n", cycle, time.Now().Format("15:04:05"))

		for i, sim := range simulators {
			// Terapkan logika skenario
			if *scenarioPtr == "full-bin" && i == 0 {
				// Paksa bin pertama menjadi penuh (jarak sensor kecil)
				sim.DistanceOrganic = 2.5 + rand.Float64()*1.0
				sim.DistanceInorganic = 3.0 + rand.Float64()*1.5
				fmt.Printf("   🔥 [SCENARIO] Forcing %s to be FULL!\n", sim.BinName)
			} else if *scenarioPtr == "gas-spike" && i == 0 {
				sim.GasAmonia = 60.0 + rand.Float64()*20.0
				fmt.Printf("   🔥 [SCENARIO] Forcing GAS SPIKE in %s!\n", sim.BinName)
			} else {
				sim.Update()
			}

			payload := sim.GetTelemetry()
			volO, volI := sim.GetVolumePcts()

			payloadJSON, _ := json.Marshal(payload)
			telemetryReq, _ := http.NewRequest("POST", baseURL+"/telemetry", bytes.NewBuffer(payloadJSON))
			telemetryReq.Header.Add("Content-Type", "application/json")
			telemetryReq.Header.Add("X-API-Key", os.Getenv("VISIOBIN_API_KEY"))
			if telemetryReq.Header.Get("X-API-Key") == "" {
				telemetryReq.Header.Set("X-API-Key", "visiobin-iot-secret-key")
			}

			resp, err := client.Do(telemetryReq)
			status := "✅"
			if err != nil || resp.StatusCode != http.StatusCreated {
				status = "⚠️"
				if resp != nil {
					fmt.Printf("      Error: Status %d\n", resp.StatusCode)
				}
			}
			if resp != nil {
				resp.Body.Close()
			}

			fmt.Printf("   %s %-30.30s | Vol: %5.1f%%/%5.1f%% | W: %.1f/%.1fkg | Gas: %.1fppm\n",
				status, sim.BinName, volO, volI, payload.WeightOrganicKg, payload.WeightInorganicKg, payload.GasAmoniaPpm)

			// Simulasi Klasifikasi AI (acak)
			if rand.Float64() < 0.3 {
				classType := "organic"
				if rand.Float64() < 0.5 {
					classType = "inorganic"
				}

				clsPayload := ClassificationPayload{
					BinID:           sim.BinID,
					PredictedClass:  classType,
					Confidence:      0.72 + rand.Float64()*0.27,
					InferenceTimeMs: rand.Intn(570) + 280,
				}
				clsJSON, _ := json.Marshal(clsPayload)
				clsReq, _ := http.NewRequest("POST", baseURL+"/classifications", bytes.NewBuffer(clsJSON))
				clsReq.Header.Add("Content-Type", "application/json")
				clsReq.Header.Add("X-API-Key", os.Getenv("VISIOBIN_API_KEY"))
				if clsReq.Header.Get("X-API-Key") == "" {
					clsReq.Header.Set("X-API-Key", "visiobin-iot-secret-key")
				}

				client.Do(clsReq)
				emoji := "🍃"
				if classType == "inorganic" {
					emoji = "♻️"
				}
				fmt.Printf("   %s AI: %s (%.1f%% conf, %dms)\n", emoji, classType, clsPayload.Confidence*100, clsPayload.InferenceTimeMs)
			}
		}
		time.Sleep(time.Duration(interval) * time.Second)
	}
}
