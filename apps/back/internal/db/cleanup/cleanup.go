package cleanup

import (
	"context"
	"log/slog"
	"time"

	reservationsRepo "place-picker/internal/db/repo/reservation"
)

func StartOldReservationsCleanup(ctx context.Context, logger *slog.Logger, repo *reservationsRepo.ReservationsRepository, interval time.Duration) {
	if interval <= 0 {
		interval = 1 * time.Hour
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	cleanupOldReservations(ctx, logger, repo)

	logger.Info("StartOldReservationsCleanup | Started old reservations cleanup", "interval", interval)

	for {
		select {
		case <-ctx.Done():
			logger.Info("StartOldReservationsCleanup | Stopping old reservations cleanup")
			return
		case <-ticker.C:
			cleanupOldReservations(ctx, logger, repo)
		}
	}
}

func cleanupOldReservations(ctx context.Context, logger *slog.Logger, repo *reservationsRepo.ReservationsRepository) {
	rowsAffected, err := repo.DeleteOldReservations(ctx)
	if err != nil {
		logger.Error("cleanupOldReservations | Failed to delete old reservations", "error", err.Error())
		return
	}

	if rowsAffected > 0 {
		logger.Info("cleanupOldReservations | Deleted old reservations", "count", rowsAffected)
	}
}
