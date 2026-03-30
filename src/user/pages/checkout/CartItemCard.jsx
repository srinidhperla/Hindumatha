import React from "react";
import { OptimizedImage } from "@/shared/ui";
import { formatCategoryLabel } from "@/utils/productOptions";

const CartItemCard = ({
  item,
  dispatch,
  updateCartItemOptions,
  updateCartQuantity,
  removeFromCart,
  showToast,
}) => (
  <article className="commerce-card">
    <div className="commerce-card-body">
      <OptimizedImage
        src={item.product.image}
        alt={item.product.name}
        width={720}
        height={480}
        loading="lazy"
        className="commerce-image"
      />

      <div className="commerce-main">
        <div className="commerce-topline">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel-500">
              {formatCategoryLabel(item.product.category)}
            </p>
            <h2 className="mt-2 text-2xl font-black text-primary-800">
              {item.product.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-600">
              {item.product.description}
            </p>
          </div>
          <div className="commerce-price-box">
            <p className="commerce-price-kicker">Line Total</p>
            <p className="commerce-price-value">
              Rs.{item.lineTotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="commerce-variant-grid">
          {item.availableEggTypes.length > 1 && (
            <label className="block">
              <span className="commerce-field-label">Cake Type</span>
              <select
                value={item.selectedEggType}
                onChange={(event) =>
                  dispatch(
                    updateCartItemOptions({
                      id: item.id,
                      selectedEggType: event.target.value,
                    }),
                  )
                }
                className="commerce-input"
              >
                <option value="">Select cake type</option>
                {item.availableEggTypes.map((eggType) => (
                  <option key={eggType} value={eggType}>
                    {eggType === "egg" ? "Egg" : "Eggless"}
                  </option>
                ))}
              </select>
            </label>
          )}

          {item.hasExplicitFlavors && (
            <label className="block">
              <span className="commerce-field-label">Flavor</span>
              <select
                value={item.selectedFlavor}
                onChange={(event) =>
                  dispatch(
                    updateCartItemOptions({
                      id: item.id,
                      selectedFlavor: event.target.value,
                    }),
                  )
                }
                className="commerce-input"
              >
                {item.availableFlavors.map((flavor) => (
                  <option key={flavor.name} value={flavor.name}>
                    {flavor.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="commerce-field-label">
              {item.portionTypeMeta.heading}
            </span>
            <select
              value={item.selectedWeight}
              onChange={(event) =>
                dispatch(
                  updateCartItemOptions({
                    id: item.id,
                    selectedWeight: event.target.value,
                  }),
                )
              }
              className="commerce-input"
            >
              {item.availableWeights.map((weight) => (
                <option key={weight.label} value={weight.label}>
                  {weight.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="commerce-field-label">Quantity</span>
            <div className="commerce-counter">
              <button
                type="button"
                onClick={() =>
                  dispatch(
                    updateCartQuantity({
                      id: item.id,
                      quantity: item.quantity - 1,
                    }),
                  )
                }
                className="commerce-counter-button"
              >
                -
              </button>
              <span className="commerce-counter-value">{item.quantity}</span>
              <button
                type="button"
                onClick={() =>
                  dispatch(
                    updateCartQuantity({
                      id: item.id,
                      quantity: item.quantity + 1,
                    }),
                  )
                }
                className="commerce-counter-button"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="commerce-meta-row">
          <div className="commerce-meta-chips">
            {item.selectedEggType && (
              <span className="commerce-chip commerce-chip--muted">
                Type: {item.selectedEggType === "egg" ? "Egg" : "Eggless"}
              </span>
            )}
            <span className="commerce-chip commerce-chip--success">
              Price: Rs.{item.unitPrice.toLocaleString("en-IN")}
            </span>
            <span
              className={`commerce-chip ${item.canOrder ? "commerce-chip--success" : "commerce-chip--danger"}`}
            >
              {item.canOrder ? "Ready for checkout" : "Unavailable"}
            </span>
          </div>

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
            className="commerce-remove-button"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </article>
);

export default CartItemCard;
