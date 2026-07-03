import React from "react";

export const Ltr: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <span dir="ltr" className={`inline-block ${className}`}>
    {children}
  </span>
);
