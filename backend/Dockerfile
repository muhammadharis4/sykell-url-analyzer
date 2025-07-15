FROM golang:1.24.5-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o backend main.go

# ---- Final stage ----
FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/backend .
COPY wait-for-db.sh .

# Expose the port
EXPOSE 8080

# Use environment variable for Gin
ENV GIN_MODE=release

RUN chmod +x wait-for-db.sh
CMD ["./wait-for-db.sh", "./backend"]
