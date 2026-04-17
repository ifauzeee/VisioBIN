package services

import (
	"context"
	"log"
	"math"
	"time"

	"github.com/ifauze/visiobin/internal/models"
	"github.com/ifauze/visiobin/internal/repository"
)

// ForecastService handles basic forecasting for bin fullness estimation.
type ForecastService struct {
	telemetryRepo *repository.TelemetryRepository
	binRepo       *repository.BinRepository
}

func NewForecastService(tr *repository.TelemetryRepository, br *repository.BinRepository) *ForecastService {
	return &ForecastService{telemetryRepo: tr, binRepo: br}
}

// EstimateTimeFull calculates when a bin will be full based on historical fill rate.
//
// Algorithm (basic forecasting - rata-rata kecepatan pengisian):
//  1. Ambil semua sensor readings dari 7 hari terakhir
//  2. Hitung rata-rata kenaikan volume per jam (fill rate)
//  3. Dari volume saat ini, hitung berapa jam lagi sampai 100%
//  4. Return estimasi waktu penuh
func (s *ForecastService) EstimateTimeFull(ctx context.Context, binID string) (*models.ForecastResult, error) {
	// Get historical readings (last 7 days)
	readings, err := s.telemetryRepo.GetForecastData(ctx, binID, 7)
	if err != nil {
		return nil, err
	}

	result := &models.ForecastResult{BinID: binID}

	if len(readings) < 2 {
		// Not enough data to forecast
		if len(readings) == 1 {
			if readings[0].VolumeOrganicPct != nil {
				result.CurrentVolumeOrganic = *readings[0].VolumeOrganicPct
			}
			if readings[0].VolumeInorganicPct != nil {
				result.CurrentVolumeInorganic = *readings[0].VolumeInorganicPct
			}
		}
		return result, nil
	}

	// Get the latest reading for current volumes
	latest := readings[len(readings)-1]
	if latest.VolumeOrganicPct != nil {
		result.CurrentVolumeOrganic = *latest.VolumeOrganicPct
	}
	if latest.VolumeInorganicPct != nil {
		result.CurrentVolumeInorganic = *latest.VolumeInorganicPct
	}

	// Calculate fill rates (average volume increase per hour)
	organicRate := s.calculateFillRate(readings, func(sr models.SensorReading) *float64 {
		return sr.VolumeOrganicPct
	})
	inorganicRate := s.calculateFillRate(readings, func(sr models.SensorReading) *float64 {
		return sr.VolumeInorganicPct
	})

	result.FillRateOrganicPerHr = organicRate
	result.FillRateInorganicPerHr = inorganicRate

	// Estimate time to full
	now := time.Now()

	if organicRate > 0 && result.CurrentVolumeOrganic < 100 {
		hoursLeft := (100 - result.CurrentVolumeOrganic) / organicRate
		estimatedTime := now.Add(time.Duration(hoursLeft * float64(time.Hour)))
		result.EstimatedFullOrganic = &estimatedTime
		result.HoursUntilFullOrganic = &hoursLeft
	}

	if inorganicRate > 0 && result.CurrentVolumeInorganic < 100 {
		hoursLeft := (100 - result.CurrentVolumeInorganic) / inorganicRate
		estimatedTime := now.Add(time.Duration(hoursLeft * float64(time.Hour)))
		result.EstimatedFullInorganic = &estimatedTime
		result.HoursUntilFullInorganic = &hoursLeft
	}

	return result, nil
}

// calculateFillRate computes the average volume increase per hour.
// It only counts positive increases (not decreases from emptying).
func (s *ForecastService) calculateFillRate(readings []models.SensorReading, getVolume func(models.SensorReading) *float64) float64 {
	var totalIncrease float64
	var totalHours float64

	for i := 1; i < len(readings); i++ {
		prevVol := getVolume(readings[i-1])
		currVol := getVolume(readings[i])

		if prevVol == nil || currVol == nil {
			continue
		}

		diff := *currVol - *prevVol
		hoursDiff := readings[i].RecordedAt.Sub(readings[i-1].RecordedAt).Hours()

		if hoursDiff <= 0 {
			continue
		}

		// Only count positive fill (skip emptying events / big drops)
		if diff > 0 && diff < 30 { // <30% jump to filter out anomalies
			totalIncrease += diff
			totalHours += hoursDiff
		}
	}

	if totalHours == 0 {
		return 0
	}

	rate := totalIncrease / totalHours
	return math.Round(rate*100) / 100 // Round to 2 decimal places
}

// CheckThresholds evaluates current sensor readings and creates alerts if needed.
func (s *ForecastService) CheckThresholds(ctx context.Context, reading *models.SensorReading, alertRepo *repository.AlertRepository) {
	binID := reading.BinID

	// Volume threshold: warn at 80%, critical at 95%
	if reading.VolumeOrganicPct != nil {
		vol := *reading.VolumeOrganicPct
		if vol >= 95 {
			_, err := alertRepo.Create(ctx, binID, "volume_critical",
				"Kompartemen ORGANIK hampir penuh (>95%)!", "critical")
			if err != nil {
				log.Printf("Failed to create alert: %v", err)
			}
		} else if vol >= 80 {
			_, err := alertRepo.Create(ctx, binID, "volume_high",
				"Volume kompartemen ORGANIK melebihi 80%", "warning")
			if err != nil {
				log.Printf("Failed to create alert: %v", err)
			}
		}
	}

	if reading.VolumeInorganicPct != nil {
		vol := *reading.VolumeInorganicPct
		if vol >= 95 {
			_, err := alertRepo.Create(ctx, binID, "volume_critical",
				"Kompartemen ANORGANIK hampir penuh (>95%)!", "critical")
			if err != nil {
				log.Printf("Failed to create alert: %v", err)
			}
		} else if vol >= 80 {
			_, err := alertRepo.Create(ctx, binID, "volume_high",
				"Volume kompartemen ANORGANIK melebihi 80%", "warning")
			if err != nil {
				log.Printf("Failed to create alert: %v", err)
			}
		}
	}

	// Gas amonia threshold: warn at 25 ppm, critical at 50 ppm
	if reading.GasAmoniaPpm != nil {
		gas := *reading.GasAmoniaPpm
		if gas >= 50 {
			_, err := alertRepo.Create(ctx, binID, "gas_critical",
				"Kadar amonia TINGGI (>50 ppm)! Sampah organik membusuk.", "critical")
			if err != nil {
				log.Printf("Failed to create alert: %v", err)
			}
		} else if gas >= 25 {
			_, err := alertRepo.Create(ctx, binID, "gas_warning",
				"Kadar amonia meningkat (>25 ppm)", "warning")
			if err != nil {
				log.Printf("Failed to create alert: %v", err)
			}
		}
	}
}
