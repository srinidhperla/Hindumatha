import React from "react";

const PaymentSuccessCard = ({ totalAmount, onViewOrders, onBackHome }) => (
  <div className="commerce-page--success flex items-center justify-center">
    <div className="commerce-success-card">
      <div className="commerce-success-icon">
        <svg
          className="h-10 w-10 text-emerald-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-black text-primary-800">
        Payment completed
      </h1>
      <p className="mt-3 text-primary-600">
        Your order is confirmed and the bakery has received it.
      </p>
      <div className="commerce-success-box">
        <p className="commerce-price-kicker">Paid total</p>
        <p className="mt-2 text-3xl font-black text-primary-300">
          Rs.{Number(totalAmount || 0).toLocaleString("en-IN")}
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onViewOrders}
          className="btn-primary w-full"
        >
          View My Orders
        </button>
        <button
          type="button"
          onClick={onBackHome}
          className="btn-secondary w-full"
        >
          Back to Home
        </button>
      </div>
    </div>
  </div>
);

export default PaymentSuccessCard;
