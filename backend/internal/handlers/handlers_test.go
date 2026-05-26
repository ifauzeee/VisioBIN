package handlers

import (
	"testing"
)

func TestIsValidPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		want     bool
	}{
		{"empty", "", false},
		{"too short", "Abc1", false},
		{"7 chars", "Abcde1f", false},
		{"no uppercase", "abcdefg1", false},
		{"no lowercase", "ABCDEFG1", false},
		{"no digit", "Abcdefgh", false},
		{"valid minimum", "Abcdefg1", true},
		{"valid complex", "MyP@ssw0rd123", true},
		{"8 chars valid", "Passw0rd", true},
		{"long valid", "ThisIsAVeryL0ngPassword", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isValidPassword(tt.password); got != tt.want {
				t.Errorf("isValidPassword(%q) = %v, want %v", tt.password, got, tt.want)
			}
		})
	}
}

func TestValidRoles(t *testing.T) {
	validCases := []string{"admin", "operator", "manager", "technician"}
	invalidCases := []string{"", "guest", "superadmin", "root", "user", "Admin"}

	for _, role := range validCases {
		if !validRoles[role] {
			t.Errorf("validRoles[%q] should be true", role)
		}
	}

	for _, role := range invalidCases {
		if validRoles[role] {
			t.Errorf("validRoles[%q] should be false", role)
		}
	}
}

func TestClampFloat(t *testing.T) {
	tests := []struct {
		name       string
		val        float64
		min        float64
		max        float64
		want       float64
	}{
		{"within range", 50, 0, 100, 50},
		{"at min", 0, 0, 100, 0},
		{"at max", 100, 0, 100, 100},
		{"below min", -10, 0, 100, 0},
		{"above max", 150, 0, 100, 100},
		{"negative range", -5, -10, -1, -5},
		{"zero", 0, -100, 100, 0},
		{"float precision", 3.14159, 0, 5, 3.14159},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := clampFloat(tt.val, tt.min, tt.max); got != tt.want {
				t.Errorf("clampFloat(%v, %v, %v) = %v, want %v", tt.val, tt.min, tt.max, got, tt.want)
			}
		})
	}
}
