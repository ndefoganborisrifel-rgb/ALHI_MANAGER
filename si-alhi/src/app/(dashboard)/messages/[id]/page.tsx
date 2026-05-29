"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administration",
  SCOLARITE: "Scolarite",
  ENSEIGNANT: "Enseignant",
  ETUDIANT: "Etudiant",
  PARENT: "Parent",
};

type Sender = { id: string; firstName: string; lastName: string; role: string };
type MessageItem = { id: string; content: string; createdAt: string; sender: Sender };
type Participant = { userId: string; user: Sender };
type ConvData = { id: string; participants: Participant[]; messages: MessageItem[] };

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [conv, setConv] = useState<ConvData | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConv = useCallback(async () => {
    const res = await fetch(`/api/messages/${id}`);
    if (res.ok) {
      const data: ConvData = await res.json();
      setConv(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // Get current user id from session via a small endpoint
    fetch("/api/users/me").then((r) => r.ok ? r.json() : null).then((u) => {
      if (u?.id) setMyUserId(u.id);
    });
    loadConv();
  }, [loadConv]);

  // Poll every 5 seconds for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/messages/${id}`).then((r) => r.ok ? r.json() : null).then((data: ConvData | null) => {
        if (data) setConv(data);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages.length]);

  async function send() {
    if (!content.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/messages/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    });
    if (res.ok) {
      const msg: MessageItem = await res.json();
      setConv((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setContent("");
    }
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const other = conv?.participants.find((p) => p.userId !== myUserId)?.user;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "var(--text-muted)" }}>
        Chargement...
      </div>
    );
  }

  if (!conv) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "var(--text-muted)" }}>Conversation introuvable.</p>
        <Link href="/messages" style={{ color: "#B91C2F", fontSize: "13px" }}>Retour aux messages</Link>
      </div>
    );
  }

  // Group messages by date
  const groups: { date: string; messages: MessageItem[] }[] = [];
  for (const msg of conv.messages) {
    const d = new Date(msg.createdAt).toDateString();
    const last = groups[groups.length - 1];
    if (!last || last.date !== d) groups.push({ date: d, messages: [msg] });
    else last.messages.push(msg);
  }

  return (
    <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 0 16px 0", borderBottom: "1px solid var(--border)", marginBottom: "0", flexShrink: 0 }}>
        <Link href="/messages" style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
          <ArrowLeft style={{ width: "13px", height: "13px" }} />Retour
        </Link>
        {other && (
          <>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#1A1A1A,#B91C2F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "700" }}>
              {other.firstName[0]}{other.lastName[0]}
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>{other.lastName} {other.firstName}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{ROLE_LABELS[other.role] ?? other.role}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0", display: "flex", flexDirection: "column", gap: "4px" }}>
        {groups.map((group) => (
          <div key={group.date}>
            <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-muted)", padding: "3px 10px", borderRadius: "20px" }}>
                {formatDate(group.messages[0].createdAt)}
              </span>
            </div>
            {group.messages.map((msg) => {
              const isMe = msg.sender.id === myUserId;
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "4px" }}>
                  <div style={{
                    maxWidth: "70%",
                    padding: "10px 14px",
                    borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isMe ? "#B91C2F" : "var(--bg-card)",
                    color: isMe ? "white" : "var(--text)",
                    border: isMe ? "none" : "1px solid var(--border)",
                    fontSize: "13px",
                    lineHeight: "1.5",
                  }}>
                    {!isMe && (
                      <p style={{ fontSize: "10px", fontWeight: "700", marginBottom: "3px", color: "#B91C2F" }}>
                        {msg.sender.firstName} {msg.sender.lastName}
                      </p>
                    )}
                    <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</p>
                    <p style={{ fontSize: "10px", marginTop: "4px", opacity: 0.7, textAlign: "right" }}>{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {conv.messages.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "40px" }}>Aucun message pour l instant. Ecrivez le premier !</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", alignItems: "flex-end" }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ecrivez votre message... (Entree pour envoyer)"
          rows={2}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1.5px solid var(--border)",
            borderRadius: "12px",
            fontSize: "13px",
            background: "var(--bg-card)",
            color: "var(--text)",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            lineHeight: "1.5",
          }}
        />
        <button
          onClick={send}
          disabled={!content.trim() || sending}
          style={{
            padding: "10px 16px",
            background: content.trim() && !sending ? "#B91C2F" : "var(--bg-muted)",
            color: content.trim() && !sending ? "white" : "var(--text-muted)",
            border: "none",
            borderRadius: "12px",
            cursor: content.trim() && !sending ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: "700",
            fontSize: "13px",
            flexShrink: 0,
          }}
        >
          <Send style={{ width: "14px", height: "14px" }} />
          {sending ? "Envoi..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
