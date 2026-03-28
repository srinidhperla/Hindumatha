export const formatINR = (amount) =>
  `\u20B9${Number(amount || 0).toLocaleString("en-IN")}`;
