"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Bell, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavbarProps {
  userName: string;
  userRole: string;
}

interface Notif {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  SCOLARITE: "Service Scolarite",
  ENSEIGNANT: "Enseignant",
  ETUDIANT: "Etudiant",
  PARENT: "Parent",
};

export function Navbar({ userName, userRole }: NavbarProps) {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setNotifs(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "all" }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>
          Annee academique 2025-2026
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <ThemeToggle />

        {/* Notification bell */}
        <div style={{ position: "relative" }} ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              border: "1.5px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <Bell style={{ width: "16px", height: "16px" }} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "3px",
                right: "3px",
                minWidth: "14px",
                height: "14px",
                background: "#B91C2F",
                color: "white",
                fontSize: "9px",
                fontWeight: "bold",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 2px",
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "320px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              overflow: "hidden",
              zIndex: 50,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-muted)",
              }}>
                <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: "11px", color: "#B91C2F", fontWeight: "600", background: "none", border: "none", cursor: "pointer" }}>
                    Tout marquer lu
                  </button>
                )}
              </div>

              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                    <Bell style={{ width: "28px", height: "28px", margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
                    <p style={{ fontSize: "13px" }}>Aucune notification</p>
                  </div>
                ) : (
                  notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border-muted)",
                        background: n.isRead ? "transparent" : "var(--red-bg)",
                        cursor: "pointer",
                        border: "none",
                        display: "block",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        {!n.isRead && <span style={{ marginTop: "5px", width: "6px", height: "6px", borderRadius: "50%", background: "#B91C2F", flexShrink: 0 }} />}
                        <div style={{ paddingLeft: n.isRead ? "14px" : "0" }}>
                          <p style={{ fontWeight: "600", fontSize: "12px", color: "var(--text)", marginBottom: "2px" }}>{n.title}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>{n.message}</p>
                          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>
                            {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "10px", borderLeft: "1px solid var(--border)" }}>
          <div style={{ width: "30px", height: "30px", background: "#B91C2F", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User style={{ width: "14px", height: "14px", color: "white" }} />
          </div>
          <div style={{ display: "none" }} className="sm:block">
            <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{userName}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{roleLabels[userRole] ?? userRole}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            border: "1.5px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="Deconnexion"
        >
          <LogOut style={{ width: "15px", height: "15px" }} />
        </button>
      </div>
    </header>
  );
}
