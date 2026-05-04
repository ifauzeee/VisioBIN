package services

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all for now
	},
}

type Client struct {
	conn *websocket.Conn
	send chan []byte
}

type Broadcaster struct {
	clients    map[*Client]bool
	broadcast  chan interface{}
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
}

func NewBroadcaster() *Broadcaster {
	return &Broadcaster{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan interface{}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (b *Broadcaster) Run() {
	for {
		select {
		case client := <-b.register:
			b.mu.Lock()
			b.clients[client] = true
			b.mu.Unlock()
			log.Println("WS: Client connected")

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
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WS: Upgrade error: %v", err)
		return
	}

	client := &Client{conn: conn, send: make(chan []byte, 256)}
	b.register <- client

	go client.writePump()
	go client.readPump(b)
}

func (c *Client) readPump(b *Broadcaster) {
	defer func() {
		b.unregister <- c
		c.conn.Close()
	}()

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
	defer func() {
		c.conn.Close()
	}()

	for message := range c.send {
		w, err := c.conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		if err := w.Close(); err != nil {
			return
		}
	}
	c.conn.WriteMessage(websocket.CloseMessage, []byte{})
}
