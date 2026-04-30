FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/visiobin-api ./cmd/server

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/visiobin-api .
# Optional: copy migrations if you want the API to run them, but docker-compose does this via volume
COPY migrations ./migrations

EXPOSE 8080
CMD ["./visiobin-api"]
