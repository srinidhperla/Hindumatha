/* Units for stock items, matching the backend (services/stockUnits.js).
 * Stock is counted in a base unit — pcs, kg or litre. A bill line's unit
 * holds `factor` base units (Box = 24 pcs, 500 g = 0.5 kg). */

export const BASE_UNITS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Weight (kg)" },
  { value: "litre", label: "Volume (litre)" },
];

const round = (value, places = 4) =>
  Math.round((Number(value) || 0) * 10 ** places) / 10 ** places;

// Units every item in a base unit can be bought in.
const MEASURE_UNITS = {
  pcs: [{ name: "pcs", factor: 1 }],
  kg: [
    { name: "kg", factor: 1 },
    { name: "g", factor: 0.001 },
  ],
  litre: [
    { name: "litre", factor: 1 },
    { name: "ml", factor: 0.001 },
  ],
};

export const shortBase = (baseUnit) =>
  baseUnit === "kg" ? "kg" : baseUnit === "litre" ? "L" : "pcs";

/* "250 g", "1 kg", "500 ml", "1 pc", "Box (24)". */
export const quantityLabel = (qty, baseUnit, packUnits = []) => {
  const amount = Number(qty) || 0;
  if (baseUnit === "kg") return amount < 1 ? `${round(amount * 1000, 0)} g` : `${round(amount, 3)} kg`;
  if (baseUnit === "litre") return amount < 1 ? `${round(amount * 1000, 0)} ml` : `${round(amount, 3)} L`;
  const pack = packUnits.find((entry) => Number(entry.factor) === amount && amount > 1);
  if (pack) return `${pack.name} (${amount})`;
  return amount === 1 ? "1 pc" : `${round(amount, 3)} pcs`;
};

/* "144 pcs (6 Box)", "12.5 kg". */
export const stockLabel = (qty, baseUnit, packUnits = []) => {
  const amount = round(qty, 3);
  const base = `${amount} ${shortBase(baseUnit)}`;
  const pack = [...packUnits].sort((a, b) => b.factor - a.factor)[0];
  if (baseUnit === "pcs" && pack && pack.factor > 1 && Math.abs(amount) >= pack.factor) {
    return `${base} (${round(amount / pack.factor, 1)} ${pack.name})`;
  }
  return base;
};

/* The units a line can be billed in: the measures for its base unit, the
 * item's own packs, and the line's current unit if it is something else. */
export const unitChoices = (line) => {
  const choices = [...(MEASURE_UNITS[line.baseUnit] || MEASURE_UNITS.pcs)];
  (line.packUnits || []).forEach((pack) => {
    if (!choices.some((entry) => entry.name.toLowerCase() === pack.name.toLowerCase())) {
      choices.push(pack);
    }
  });
  if (line.unit && !choices.some((entry) => entry.name.toLowerCase() === line.unit.toLowerCase())) {
    choices.push({ name: line.unit, factor: Number(line.unitFactor) || 1 });
  }
  return choices;
};

export const isMeasure = (line) =>
  (MEASURE_UNITS[line.baseUnit] || MEASURE_UNITS.pcs).some(
    (entry) => entry.name.toLowerCase() === String(line.unit || "").toLowerCase(),
  );

/* Quick choices for "sell as": a piece and each pack, or common weights. */
export const sellPresets = (baseUnit, packUnits = []) => {
  if (baseUnit === "kg") return [0.1, 0.25, 0.5, 1].map((qty) => ({ qty, label: quantityLabel(qty, "kg") }));
  if (baseUnit === "litre") return [0.25, 0.5, 1].map((qty) => ({ qty, label: quantityLabel(qty, "litre") }));
  return [
    { qty: 1, label: "1 pc" },
    ...packUnits
      .filter((pack) => pack.factor > 1)
      .map((pack) => ({ qty: pack.factor, label: quantityLabel(pack.factor, "pcs", packUnits) })),
  ];
};

export { round };
