"use client";

interface SchoolLogoProps {
  size?: number;
  className?: string;
  wrapperStyle?: React.CSSProperties;
}

export function SchoolLogo({ size = 40, className, wrapperStyle }: SchoolLogoProps) {
  // logo.svg is a horizontal banner (2.8:1 ratio), display proportionally
  const height = size;
  const width = Math.round(size * 2.8);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: size * 0.18,
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    padding: 2,
    ...wrapperStyle,
  };

  return (
    <div style={containerStyle} className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="ALI" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
}
