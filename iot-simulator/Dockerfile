FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/simulator main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/simulator .

# The simulator needs to point to the backend service in docker-compose
# We'll use an environment variable to override the base URL
ENTRYPOINT ["./simulator"]
CMD ["-url", "http://backend:8080/api/v1", "-interval", "5"]
