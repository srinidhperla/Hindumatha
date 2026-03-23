import React from "react";
import { ActionButton } from "./Primitives";

const Button = ({ children, ...props }) => (
  <ActionButton {...props}>{children}</ActionButton>
);

export default Button;
