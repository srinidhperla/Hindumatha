import React from "react";

const CheckoutSuccessState = ({ totalAmount, onBackHome }) => (
  <div className="commerce-page--success flex items-center justify-center">
    <div className="commerce-success-card">
      <h2 className="mt-2 text-3xl font-black text-primary-800">
        Order placed successfully
      </h2>
      <p className="mt-3 text-primary-600">
        Your full cart was converted into one order with all selected flavors,
        weights, and quantities.
      </p>
      <div className="commerce-success-box">
        <p className="commerce-price-kicker">Order total</p>
        <p className="mt-2 text-3xl font-black text-primary-300">
          Rs.{totalAmount.toLocaleString("en-IN")}
        </p>
      </div>
      <button
        type="button"
        onClick={onBackHome}
        className="btn-primary mt-8 w-full"
      >
        Back to Home
      </button>
    </div>
  </div>
);

export default CheckoutSuccessState;
