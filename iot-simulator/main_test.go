package main

import "testing"

func TestShouldCollectWhenEitherCompartmentIsNearFull(t *testing.T) {
	tests := []struct {
		name         string
		organicPct   float64
		inorganicPct float64
		roll         float64
		want         bool
	}{
		{
			name:       "collects when organic is near full",
			organicPct: 91,
			roll:       0.7,
			want:       true,
		},
		{
			name:         "collects when inorganic is near full",
			inorganicPct: 91,
			roll:         0.7,
			want:         true,
		},
		{
			name:         "waits when collection chance does not trigger",
			organicPct:   95,
			inorganicPct: 96,
			roll:         0.4,
			want:         false,
		},
		{
			name:         "does not collect below near full threshold",
			organicPct:   80,
			inorganicPct: 80,
			roll:         0.9,
			want:         false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := shouldCollect(tt.organicPct, tt.inorganicPct, tt.roll)
			if got != tt.want {
				t.Fatalf("shouldCollect(%v, %v, %v) = %v, want %v", tt.organicPct, tt.inorganicPct, tt.roll, got, tt.want)
			}
		})
	}
}
