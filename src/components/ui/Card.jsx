import React from "react";
import { SurfaceCard } from "./Primitives";

const Card = ({ children, className = "" }) => (
  <SurfaceCard className={className}>{children}</SurfaceCard>
);

export default Card;
