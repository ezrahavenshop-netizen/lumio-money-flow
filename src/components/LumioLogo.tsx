import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

const LumioLogo: React.FC<LogoProps> = ({ size = "md", variant = "dark" }) => {
  const sizeMap = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" };
  const navyColor = variant === "dark" ? "text-lumio-primary" : "text-primary-foreground";

  return (
    <span className={`font-serif font-normal ${sizeMap[size]} tracking-tight`}>
      <span className={navyColor}>Lumi</span>
      <span className="text-lumio-accent">o</span>
    </span>
  );
};

export default LumioLogo;
