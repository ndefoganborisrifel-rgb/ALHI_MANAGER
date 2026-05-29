"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Search, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageUI";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administration",
  SCOLARITE: "Scolarite",
  ENSEIGNANT: "Enseignant",
  ETUDIANT: "Etudiant",
  PARENT: "Parent",
};

type ConvItem = {
  id: string;
  updatedAt: string;
  lastMessage: { content: string; createdAt: string } | null;
  unread: number;
  other: { id: string; firstName: string; lastName: string; role: string } | null;
};

type UserItem = { id: string; firstName: string; lastName: string; role: string; email: string };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "a l instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [firstMsg, setFirstMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const loadConvs = useCallback(async () => {
    const res = await fetch("/api/messages");
    if (res.ok) setConversations(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  async function openNew() {
    setShowNew(true);
    if (users.length === 0) {
      const res = await fetch("/api/users/directory");
      if (res.ok) setUsers(await res.json());
    }
  }

  async function startConversation() {
    if (!selectedUser || !firstMsg.trim()) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: selectedUser.id, content: firstMsg.trim() }),
    });
    if (res.ok) {
      const data = await res.json() as { conversationId: string };
      setShowNew(false);
      setSelectedUser(null);
      setFirstMsg("");
      setUserSearch("");
      window.location.href = `/messages/${data.conversationId}`;
    }
    setSending(false);
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || ROLE_LABELS[u.role]?.toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: "800px" }}>
      <PageHeader
        title="Messagerie"
        subtitle="Communication interne entre les membres de l etablissement"
        backHref="/dashboard"
        icon={<MessageSquare style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
        actions={(
          <button
            onClick={openNew}
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 18px", background: "#B91C2F", color: "white", borderRadius: "10px", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer" }}
          >
            <Plus style={{ width: "15px", height: "15px" }} />Nouveau message
          </button>
        )}
      />

      {/* New conversation modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "16px", width: "100%", maxWidth: "480px", padding: "24px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text)", marginBottom: "16px" }}>Nouveau message</h2>
            {!selectedUser ? (
              <>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>Choisissez un destinataire :</p>
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, role..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-muted)", cursor: "pointer", textAlign: "left", width: "100%" }}
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#1A1A1A,#B91C2F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{u.lastName} {u.firstName}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{ROLE_LABELS[u.role] ?? u.role}</p>
                      </div>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "20px" }}>Aucun utilisateur trouve.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: "var(--bg-muted)", marginBottom: "14px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#1A1A1A,#B91C2F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "700" }}>
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{selectedUser.lastName} {selectedUser.firstName}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{ROLE_LABELS[selectedUser.role] ?? selectedUser.role}</p>
                  </div>
                  <button onClick={() => setSelectedUser(null)} style={{ marginLeft: "auto", fontSize: "11px", color: "#B91C2F", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>Changer</button>
                </div>
                <textarea
                  placeholder="Votre message..."
                  value={firstMsg}
                  onChange={(e) => setFirstMsg(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg)", color: "var(--text)", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
              <button onClick={() => { setShowNew(false); setSelectedUser(null); setFirstMsg(""); setUserSearch(""); }} style={{ padding: "8px 16px", border: "1.5px solid var(--border)", borderRadius: "8px", background: "var(--bg-card)", color: "var(--text)", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                Annuler
              </button>
              {selectedUser && (
                <button
                  onClick={startConversation}
                  disabled={!firstMsg.trim() || sending}
                  style={{ padding: "8px 18px", background: firstMsg.trim() && !sending ? "#B91C2F" : "var(--bg-muted)", color: firstMsg.trim() && !sending ? "white" : "var(--text-muted)", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: firstMsg.trim() && !sending ? "pointer" : "not-allowed" }}
                >
                  {sending ? "Envoi..." : "Envoyer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conversation list */}
      <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Chargement...</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--text-muted)" }}>
              <MessageSquare style={{ width: "22px", height: "22px" }} />
            </div>
            <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)", marginBottom: "4px" }}>Aucun message</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Commencez une conversation en cliquant sur "Nouveau message".</p>
          </div>
        ) : (
          conversations.map((conv, i) => (
            <Link key={conv.id} href={`/messages/${conv.id}`} style={{ textDecoration: "none", display: "block" }}>
              <div
                className="row-hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 18px",
                  borderBottom: i < conversations.length - 1 ? "1px solid var(--border-muted)" : "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#1A1A1A,#B91C2F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "700", flexShrink: 0, position: "relative" }}>
                  {conv.other ? `${conv.other.firstName[0]}${conv.other.lastName[0]}` : "?"}
                  {conv.unread > 0 && (
                    <span style={{ position: "absolute", top: "-3px", right: "-3px", width: "16px", height: "16px", borderRadius: "50%", background: "#B91C2F", color: "white", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                    <p style={{ fontSize: "13px", fontWeight: conv.unread > 0 ? "700" : "600", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.other ? `${conv.other.lastName} ${conv.other.firstName}` : "Utilisateur inconnu"}
                    </p>
                    {conv.lastMessage && (
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo(conv.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: conv.unread > 0 ? "var(--text-secondary)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: conv.unread > 0 ? "600" : "normal" }}>
                    {conv.lastMessage ? conv.lastMessage.content : "Aucun message"}
                  </p>
                </div>
                <ChevronRight style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
