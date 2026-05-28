"use client";

interface SchoolLogoProps {
  size?: number;
  className?: string;
  wrapperStyle?: React.CSSProperties;
}

export function SchoolLogo({ size = 40, className, wrapperStyle }: SchoolLogoProps) {
  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: size * 0.18,
    background: "linear-gradient(135deg, #B91C2F, #6B0D1A)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    ...wrapperStyle,
  };

  return (
    <div style={containerStyle} className={className}>
      <span style={{ fontSize: size * 0.38, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1, fontFamily: "'Arial Black','Arial Bold',Arial,sans-serif" }}>ALI</span>
    </div>
  );
}
