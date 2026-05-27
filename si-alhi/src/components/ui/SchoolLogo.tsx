"use client";
import { useState } from "react";

interface SchoolLogoProps {
  size?: number;
  className?: string;
  wrapperStyle?: React.CSSProperties;
}

export function SchoolLogo({ size = 40, className, wrapperStyle }: SchoolLogoProps) {
  const [error, setError] = useState(false);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: size * 0.2,
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    ...wrapperStyle,
  };

  if (error) {
    return (
      <div style={{ ...containerStyle, background: "#B91C2F" }}>
        <span style={{ color: "white", fontWeight: "900", fontSize: size * 0.36, letterSpacing: "-0.5px", lineHeight: 1 }}>
          ALI
        </span>
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="ALHI"
        style={{ width: size * 0.9, height: size * 0.9, objectFit: "contain" }}
        onError={() => setError(true)}
      />
    </div>
  );
}
