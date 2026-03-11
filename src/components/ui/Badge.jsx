import React from "react";
import { StatusChip } from "./Primitives";

const Badge = ({ children, tone = "neutral", className = "" }) => (
  <StatusChip tone={tone} className={className}>
    {children}
  </StatusChip>
);

export default Badge;
