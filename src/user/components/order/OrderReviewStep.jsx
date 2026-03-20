import React from "react";
import { Link } from "react-router-dom";

const getSafeUnitPrice = (item) =>
  Number(
    item.unitPrice ??
      item.price ??
      (Number(item.quantity || 0) > 0
        ? Number(item.lineTotal || 0) / Number(item.quantity || 1)
        : 0),
  );

const OrderReviewStep = ({ checkoutItems, invalidItems }) => (
  <div className="commerce-section-body">
    <div className="commerce-section-header">
      <div>
        <h2 className="commerce-section-title">Review cart items</h2>
        <p className="commerce-section-copy">
          Go back to cart if you want to change flavors, options, or quantities.
        </p>
      </div>
      <Link to="/cart" className="btn-secondary">
        Edit Cart
      </Link>
    </div>

    <div className="mt-8 space-y-4">
      {checkoutItems.map((item) => (
        <div key={item.id} className="commerce-card-compact">
          <div className="commerce-topline">
            <div>
              <h3 className="text-lg font-bold text-primary-800">
                {item.product.name}
              </h3>
              <div className="commerce-meta-chips mt-2">
                <span className="commerce-chip commerce-chip--muted">
                  {`${item.portionTypeMeta?.singular || "Option"}: ${item.selectedWeight}`}
                </span>
                {item.selectedEggType && (
                  <span className="commerce-chip commerce-chip--muted">
                    {`Type: ${item.selectedEggType === "egg" ? "Egg" : "Eggless"}`}
                  </span>
                )}
                {item.selectedFlavor && (
                  <span className="commerce-chip commerce-chip--muted">
                    {`Flavor: ${item.selectedFlavor}`}
                  </span>
                )}
                <span className="commerce-chip commerce-chip--muted">
                  {`Qty: ${item.quantity}`}
                </span>
                <span className="commerce-chip commerce-chip--success">
                  {`Price: Rs.${getSafeUnitPrice(item).toLocaleString("en-IN")}`}
                </span>
              </div>
            </div>
            <div className="commerce-price-box commerce-price-box--compact">
              <p className="commerce-price-kicker">Line total</p>
              <p className="commerce-price-value">
                ₹{item.lineTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          {!item.canOrder && (
            <p className="commerce-alert commerce-alert--danger">
              This item is not available for checkout. Update it in the cart
              first.
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default OrderReviewStep;
