package services

import (
	"context"
	"log"
	"math"
	"time"

	"github.com/ifauze/visiobin/internal/models"
	"github.com/ifauze/visiobin/internal/repository"
)

type ForecastService struct {
	telemetryRepo *repository.TelemetryRepository
	binRepo       *repository.BinRepository
}

func NewForecastService(tr *repository.TelemetryRepository, br *repository.BinRepository) *ForecastService {
	return &ForecastService{
		telemetryRepo: tr,
		binRepo:       br,
	}
}

func (s *ForecastService) EstimateTimeFull(ctx context.Context, binID string) (*models.ForecastResult, error) {
	readings, err := s.telemetryRepo.GetForecastData(ctx, binID, 7)
	if err != nil {
		return nil, err
	}

	result := &models.ForecastResult{BinID: binID}

	if len(readings) < 2 {
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

	latest := readings[len(readings)-1]
	if latest.VolumeOrganicPct != nil {
		result.CurrentVolumeOrganic = *latest.VolumeOrganicPct
	}
	if latest.VolumeInorganicPct != nil {
		result.CurrentVolumeInorganic = *latest.VolumeInorganicPct
	}

	organicRate := s.calculateFillRate(readings, func(sr models.SensorReading) *float64 {
		return sr.VolumeOrganicPct
	})
	inorganicRate := s.calculateFillRate(readings, func(sr models.SensorReading) *float64 {
		return sr.VolumeInorganicPct
	})

	result.FillRateOrganicPerHr = organicRate
	result.FillRateInorganicPerHr = inorganicRate

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

		// Filter anomalies and only count positive fill
		if diff > 0 && diff < 30 {
			totalIncrease += diff
			totalHours += hoursDiff
		}
	}

	if totalHours == 0 {
		return 0
	}

	rate := totalIncrease / totalHours
	return math.Round(rate*100) / 100
}

func (s *ForecastService) CheckThresholds(ctx context.Context, reading *models.SensorReading, alertRepo *repository.AlertRepository) {
	// Volume Checks
	s.checkVolume(ctx, alertRepo, reading.BinID, "ORGANIK", reading.VolumeOrganicPct)
	s.checkVolume(ctx, alertRepo, reading.BinID, "ANORGANIK", reading.VolumeInorganicPct)

	// Ammonia Checks
	if reading.GasAmoniaPpm != nil {
		gas := *reading.GasAmoniaPpm
		if gas >= 50 {
			s.createAlert(ctx, alertRepo, reading.BinID, "gas_critical", "Kadar amonia TINGGI (>50 ppm)! Sampah organik membusuk.", "critical")
		} else if gas >= 25 {
			s.createAlert(ctx, alertRepo, reading.BinID, "gas_warning", "Kadar amonia meningkat (>25 ppm)", "warning")
		}
	}
}

func (s *ForecastService) checkVolume(ctx context.Context, alertRepo *repository.AlertRepository, binID, label string, volPtr *float64) {
	if volPtr == nil {
		return
	}

	vol := *volPtr
	if vol >= 95 {
		s.createAlert(ctx, alertRepo, binID, "volume_critical", "Kompartemen "+label+" hampir penuh (>95%)!", "critical")
	} else if vol >= 80 {
		s.createAlert(ctx, alertRepo, binID, "volume_high", "Volume kompartemen "+label+" melebihi 80%", "warning")
	}
}

func (s *ForecastService) createAlert(ctx context.Context, alertRepo *repository.AlertRepository, binID, alertType, message, severity string) {
	if _, err := alertRepo.Create(ctx, binID, alertType, message, severity); err != nil {
		log.Printf("Alert Error [%s]: %v", alertType, err)
	}
}
