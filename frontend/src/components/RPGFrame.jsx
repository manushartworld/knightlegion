import React from "react";

export function RPGFrame({ className = "", glow = false, children, ...props }) {
  return (
    <div
      className={`rpg-frame ${glow ? "glow-hover" : ""} ${className}`}
      {...props}
    >
      <span className="corner-tr" aria-hidden />
      <span className="corner-bl" aria-hidden />
      {children}
    </div>
  );
}

export default RPGFrame;
