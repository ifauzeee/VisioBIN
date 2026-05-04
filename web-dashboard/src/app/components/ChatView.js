"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  MessageSquare, Send, Users, Hash, MoreHorizontal,
  Search, ChevronRight, Paperclip, Smile, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { listChatHistory, sendChatMessage, listUsers, WS_BASE } from "../services/api";

export default function ChatView() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState(null); // null = General Channel
  const scrollRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setFetchingHistory(true);
    try {
      const otherId = selectedRecipient ? selectedRecipient.id : "";
      const historyRes = await listChatHistory(token, otherId, 100);
      if (historyRes.success) {
        setMessages(historyRes.data || []);
      }
    } catch (err) {
      console.error("Chat history error:", err);
    } finally {
      setFetchingHistory(false);
      setLoading(false);
    }
  }, [token, selectedRecipient]);

  const fetchMembers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await listUsers(token);
      if (res.success) {
        setMembers(res.data || []);
      }
    } catch (err) {
      console.error("Members fetch error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(WS_BASE);
    ws.onmessage = (event) => {
      try {
        const { event: evType, data } = JSON.parse(event.data);
        if (evType === "chat_message") {
          const isGeneralMsg = !data.recipient_id;
          const isForMe = data.recipient_id === user?.id;
          const sentByMe = data.sender_id === user?.id;

          if (!selectedRecipient) {
            if (isGeneralMsg) setMessages((prev) => [...prev, data]);
          } else {
            const isFromSelected = data.sender_id === selectedRecipient.id;
            const isToSelected = data.recipient_id === selectedRecipient.id;
            if ((sentByMe && isToSelected) || (isFromSelected && isForMe)) {
              setMessages((prev) => [...prev, data]);
            }
          }
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    };

    return () => ws.close();
  }, [token, selectedRecipient, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, fetchingHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    const text = inputText;
    const recipientId = selectedRecipient ? selectedRecipient.id : null;
    setInputText("");
    setSending(true);
    try {
      const res = await sendChatMessage(token, text, recipientId);
      if (!res.success) {
        alert("Gagal mengirim pesan: " + res.message);
        setInputText(text);
      }
    } catch (err) {
      alert("Error: " + err.message);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleSelectRecipient = (member) => {
    if (member?.id === user?.id) return;
    setSelectedRecipient(member);
  };

  if (loading && members.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
        <Loader2 className="animate-spin" color="var(--brand-organic)" size={32} />
      </div>
    );
  }

  return (
    <div style={{ 
      display: "flex", 
      height: "calc(100vh - 180px)", 
      background: "var(--bg-card)", 
      border: "1px solid var(--border-color)",
      borderRadius: 12,
      overflow: "hidden"
    }}>
      {/* Main Chat Container */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: showMembers ? "1px solid var(--border-color)" : "none" }}>
        {/* Header */}
        <div style={{ 
          padding: "16px 24px", 
          borderBottom: "1px solid var(--border-color)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.01)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div 
              style={{ color: "var(--brand-organic)", cursor: "pointer" }}
              onClick={() => setSelectedRecipient(null)}
            >
              {selectedRecipient ? <ChevronRight style={{ transform: "rotate(180deg)" }} /> : <Hash size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)" }}>
                {selectedRecipient ? selectedRecipient.full_name : "Diskusi Tim General"}
              </h2>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {selectedRecipient ? `Chat pribadi dengan ${selectedRecipient.role}` : `${members.length} anggota terhubung`}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onClick={() => setShowMembers(!showMembers)}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
            >
              <Users size={18} />
            </button>
            <button style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "24px", 
            display: "flex", 
            flexDirection: "column", 
            position: "relative"
          }}
          className="hide-scrollbar"
        >
          <AnimatePresence mode="wait">
            {fetchingHistory ? (
              <motion.div 
                key="loading-chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}
              >
                <Loader2 className="animate-spin" color="var(--brand-organic)" size={24} />
              </motion.div>
            ) : (
              <motion.div
                key={selectedRecipient ? selectedRecipient.id : "general"}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {messages.length === 0 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-muted)", fontSize: 13 }}>
                    {selectedRecipient ? `Mulai percakapan pribadi dengan ${selectedRecipient.full_name}` : "Belum ada pesan dalam diskusi ini"}
                  </div>
                )}
                
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                        alignSelf: isMe ? "flex-end" : "flex-start"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        {!isMe && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)" }}>{msg.sender_name}</span>}
                        <span style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.8 }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div style={{
                        padding: "10px 14px",
                        borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        background: isMe ? "var(--brand-organic)" : "var(--bg-hover)",
                        color: isMe ? "#fff" : "var(--text-main)",
                        fontSize: 14,
                        lineHeight: 1.5,
                        border: isMe ? "none" : "1px solid var(--border-color)",
                      }}>
                        {msg.content}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimalist Input */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)" }}>
          <form 
            onSubmit={handleSend}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12,
              background: "var(--bg-page)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              padding: "4px 8px 4px 16px"
            }}
          >
            <button type="button" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><Paperclip size={18} /></button>
            <input 
              type="text"
              placeholder={selectedRecipient ? `Pesan ke ${selectedRecipient.full_name}...` : "Ketik pesan..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
              style={{ 
                flex: 1, 
                background: "transparent", 
                border: "none", 
                color: "var(--text-main)", 
                fontSize: 14,
                outline: "none",
                padding: "8px 0"
              }}
            />
            <button type="button" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><Smile size={18} /></button>
            <button 
              type="submit"
              disabled={!inputText.trim() || sending}
              style={{ 
                background: "var(--brand-organic)", 
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: !inputText.trim() || sending ? 0.6 : 1
              }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>

      {/* Professional Sidebar */}
      <AnimatePresence>
        {showMembers && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>Anggota Tim</div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }} className="hide-scrollbar">
              <div 
                onClick={() => setSelectedRecipient(null)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 12, 
                  padding: "10px 12px", 
                  borderRadius: 8,
                  cursor: "pointer",
                  background: !selectedRecipient ? "var(--bg-hover)" : "transparent",
                  marginBottom: 8
                }}
              >
                <div style={{ 
                  width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.1)", 
                  display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-organic)" 
                }}>
                  <Hash size={18} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>General Channel</div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", padding: "12px 12px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Pesan Langsung
              </div>

              {members.filter(m => m.id !== user?.id).map(m => (
                <div 
                  key={m.id} 
                  onClick={() => handleSelectRecipient(m)}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    padding: "8px 12px", 
                    borderRadius: 8,
                    cursor: "pointer",
                    background: selectedRecipient?.id === m.id ? "var(--bg-hover)" : "transparent",
                    transition: "background 0.2s"
                  }}
                >
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: "50%", 
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border-color)",
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-main)"
                  }}>
                    {m.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.full_name}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {m.role}
                    </div>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-organic)" }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
