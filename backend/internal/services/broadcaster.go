package services

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// In production, validate against allowed origins
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true // Allow non-browser clients (IoT, etc.)
		}
		// Accept localhost for development
		if strings.Contains(origin, "localhost") || strings.Contains(origin, "127.0.0.1") {
			return true
		}
		// Accept any origin for now — should be restricted in production
		return true
	},
}

type Client struct {
	conn   *websocket.Conn
	send   chan []byte
	userID string
	role   string
}

type Broadcaster struct {
	clients    map[*Client]bool
	broadcast  chan interface{}
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
	jwtSecret  string
}

func NewBroadcaster() *Broadcaster {
	return &Broadcaster{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan interface{}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// SetJWTSecret configures the JWT secret for WebSocket authentication
func (b *Broadcaster) SetJWTSecret(secret string) {
	b.jwtSecret = secret
}

func (b *Broadcaster) Run() {
	for {
		select {
		case client := <-b.register:
			b.mu.Lock()
			b.clients[client] = true
			b.mu.Unlock()
			log.Printf("WS: Client connected (user=%s, role=%s)", client.userID, client.role)

		case client := <-b.unregister:
			b.mu.Lock()
			if _, ok := b.clients[client]; ok {
				delete(b.clients, client)
				close(client.send)
			}
			b.mu.Unlock()
			log.Println("WS: Client disconnected")

		case message := <-b.broadcast:
			msgBytes, err := json.Marshal(message)
			if err != nil {
				log.Printf("WS: Error marshaling broadcast message: %v", err)
				continue
			}

			b.mu.Lock()
			for client := range b.clients {
				select {
				case client.send <- msgBytes:
				default:
					close(client.send)
					delete(b.clients, client)
				}
			}
			b.mu.Unlock()
		}
	}
}

func (b *Broadcaster) Broadcast(message interface{}) {
	b.broadcast <- message
}

func (b *Broadcaster) ServeWS(w http.ResponseWriter, r *http.Request) {
	// Authenticate WebSocket connection via token query param
	userID := "anonymous"
	role := "guest"

	tokenString := r.URL.Query().Get("token")
	if tokenString != "" && b.jwtSecret != "" {
		claims := &struct {
			UserID   string `json:"user_id"`
			Username string `json:"username"`
			Role     string `json:"role"`
			jwt.RegisteredClaims
		}{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(b.jwtSecret), nil
		})

		if err == nil && token.Valid {
			userID = claims.UserID
			role = claims.Role
		} else {
			log.Printf("WS: Invalid token from %s: %v", r.RemoteAddr, err)
			// Still allow connection but as anonymous/guest for monitoring dashboards
		}
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WS: Upgrade error: %v", err)
		return
	}

	client := &Client{
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
		role:   role,
	}
	b.register <- client

	go client.writePump()
	go client.readPump(b)
}

func (c *Client) readPump(b *Broadcaster) {
	defer func() {
		b.unregister <- c
		c.conn.Close()
	}()

	// Set read deadline and pong handler for connection health
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, p, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		var msg struct {
			Event string      `json:"event"`
			Data  interface{} `json:"data"`
		}
		if err := json.Unmarshal(p, &msg); err == nil {
			// If it's a client message, broadcast it to others
			// Note: In a production app, we should validate the sender and save to DB here.
			// But since Broadcaster is generic, we'll just relay for now or handle specifically.
			if msg.Event == "send_chat" {
				b.broadcast <- msg
			}
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			// Send ping to check client is still alive
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
