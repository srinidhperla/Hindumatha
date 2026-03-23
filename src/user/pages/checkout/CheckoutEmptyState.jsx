import React from "react";
import { Link } from "react-router-dom";

const CheckoutEmptyState = () => (
  <div className="commerce-page--empty">
    <div className="commerce-empty-shell">
      <div className="commerce-empty-card">
        <p className="commerce-kicker">Checkout</p>
        <h1 className="mt-4 text-4xl font-black text-primary-800">
          Your cart has no items to checkout
        </h1>
        <p className="commerce-copy mt-4">
          Add items from the menu first, then return here to place the order.
        </p>
        <Link to="/menu" className="btn-primary mt-8">
          Browse Menu
        </Link>
      </div>
    </div>
  </div>
);

export default CheckoutEmptyState;
