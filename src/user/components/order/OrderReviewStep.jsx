import React from "react";
import { Link } from "react-router-dom";

const OrderReviewStep = ({ checkoutItems, invalidItems }) => (
  <div className="commerce-section-body">
    <div className="commerce-section-header">
      <div>
        <h2 className="commerce-section-title">Review cart items</h2>
        <p className="commerce-section-copy">
          Go back to cart if you want to change flavors, weights, or quantities.
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
              <p className="mt-1 text-sm text-primary-600">
                {item.selectedWeight} • {item.selectedFlavor} • Qty{" "}
                {item.quantity}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-500">Line total</p>
              <p className="text-xl font-black text-primary-600">
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
