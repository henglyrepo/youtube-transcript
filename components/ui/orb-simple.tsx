"use client";

interface OrbProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Orb({ className = "", size = "md" }: OrbProps) {
  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} ${className}`}
      style={{ perspective: "1000px" }}
    >
      <div
        className="absolute inset-0 animate-orb-pulse"
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          animation: "orb-float 8s ease-in-out infinite, orb-morph 12s ease-in-out infinite",
          filter: "blur(1px)",
        }}
      />
      <div
        className="absolute inset-0 animate-orb-pulse-delay"
        style={{
          background: "linear-gradient(225deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)",
          borderRadius: "40% 60% 70% 30% / 40% 70% 30% 60%",
          animation: "orb-float 8s ease-in-out infinite reverse, orb-morph 12s ease-in-out infinite reverse",
          filter: "blur(2px)",
          opacity: 0.7,
        }}
      />
      <div
        className="absolute inset-0 animate-orb-glow"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
