import React, { useEffect, useState } from "react";
import { OptimizedImage } from "@/shared/ui";
import { formatINR } from "@/utils/currency";

/**
 * Compact cart row: thumbnail, name, a one-line option summary and the stepper.
 * The option selects stay collapsed so phones show several items per screen,
 * and auto-open when the item still needs a choice before checkout.
 */
const CartItemCard = ({
  item,
  dispatch,
  updateCartItemOptions,
  updateCartQuantity,
  removeFromCart,
  showToast,
}) => {
  const hasOptions =
    item.availableEggTypes.length > 1 ||
    item.hasExplicitFlavors ||
    item.hasWeightOptions;

  // An item can be un-orderable either because a choice is still missing, or
  // because the product itself is unavailable. Only the first is fixable here.
  const missingSelection =
    (item.availableEggTypes.length > 1 && !item.selectedEggType) ||
    (item.hasExplicitFlavors && !item.selectedFlavor) ||
    (item.hasWeightOptions && !item.selectedWeight);
  const needsSelection = !item.canOrder && missingSelection;
  const isUnavailable = !item.canOrder && !missingSelection;

  const [isEditing, setIsEditing] = useState(false);

  // Surface the fix directly when the shopper can actually resolve it.
  useEffect(() => {
    if (needsSelection) {
      setIsEditing(true);
    }
  }, [needsSelection]);

  const optionSummary = [
    item.selectedEggType
      ? item.selectedEggType === "egg"
        ? "Egg"
        : "Eggless"
      : "",
    item.selectedFlavor,
    item.selectedWeight,
  ]
    .filter(Boolean)
    .join(" · ");

  const handleOptionChange = (key, value) =>
    dispatch(updateCartItemOptions({ id: item.id, [key]: value }));

  return (
    <article className="cart-row">
      <OptimizedImage
        src={item.product.image}
        alt={item.product.name}
        width={160}
        height={160}
        loading="lazy"
        className="cart-row-thumb"
      />

      <div className="cart-row-body">
        <p className="cart-row-name">{item.product.name}</p>

        {optionSummary ? (
          <p className="cart-row-meta">{optionSummary}</p>
        ) : null}

        {needsSelection ? (
          <p className="mt-1 text-xs font-semibold text-berry-600">
            Choose the required options to continue
          </p>
        ) : null}

        {isUnavailable ? (
          <p className="mt-1 text-xs font-semibold text-berry-600">
            Currently unavailable — please remove to continue
          </p>
        ) : null}

        {isEditing && hasOptions ? (
          <div className="cart-options">
            {item.availableEggTypes.length > 1 ? (
              <label className="block">
                <span className="cart-option-label">Cake Type</span>
                <select
                  value={item.selectedEggType}
                  onChange={(event) =>
                    handleOptionChange("selectedEggType", event.target.value)
                  }
                  className="cart-option-select"
                >
                  <option value="">Select</option>
                  {item.availableEggTypes.map((eggType) => (
                    <option key={eggType} value={eggType}>
                      {eggType === "egg" ? "Egg" : "Eggless"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {item.hasExplicitFlavors ? (
              <label className="block">
                <span className="cart-option-label">Flavor</span>
                <select
                  value={item.selectedFlavor}
                  onChange={(event) =>
                    handleOptionChange("selectedFlavor", event.target.value)
                  }
                  className="cart-option-select"
                >
                  {item.availableFlavors.map((flavor) => (
                    <option key={flavor.name} value={flavor.name}>
                      {flavor.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {item.hasWeightOptions ? (
              <label className="block">
                <span className="cart-option-label">
                  {item.portionTypeMeta.heading}
                </span>
                <select
                  value={item.selectedWeight}
                  onChange={(event) =>
                    handleOptionChange("selectedWeight", event.target.value)
                  }
                  className="cart-option-select"
                >
                  {item.availableWeights.map((weight) => (
                    <option key={weight.label} value={weight.label}>
                      {weight.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ) : null}

        <div className="cart-row-actions">
          {hasOptions ? (
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="cart-row-edit"
            >
              {isEditing ? "Done" : "Edit options"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              dispatch(removeFromCart(item.id));
              dispatch(
                showToast({
                  message: `${item.product.name} removed from cart.`,
                  type: "info",
                }),
              );
            }}
            className="cart-row-remove"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="cart-row-side">
        <div className="text-right">
          <p className="cart-row-price">{formatINR(item.lineTotal)}</p>
          {item.quantity > 1 ? (
            <p className="cart-row-unit">{formatINR(item.unitPrice)} each</p>
          ) : null}
        </div>

        <div className="cart-stepper">
          <button
            type="button"
            aria-label={`Decrease ${item.product.name} quantity`}
            onClick={() =>
              dispatch(
                updateCartQuantity({ id: item.id, quantity: item.quantity - 1 }),
              )
            }
            className="cart-stepper-btn"
          >
            −
          </button>
          <span className="cart-stepper-value">{item.quantity}</span>
          <button
            type="button"
            aria-label={`Increase ${item.product.name} quantity`}
            onClick={() =>
              dispatch(
                updateCartQuantity({ id: item.id, quantity: item.quantity + 1 }),
              )
            }
            className="cart-stepper-btn"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
};

export default CartItemCard;
