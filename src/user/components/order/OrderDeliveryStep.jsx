import React from "react";

const OrderDeliveryStep = ({
  formData,
  normalizedDeliverySettings,
  minimumScheduleDateTime,
  pauseUntilLabel,
  pricing,
  availableCoupons,
  onChange,
  onBack,
}) => {
  const isScheduled = formData.deliveryMode === "scheduled";

  return (
    <div className="commerce-section-body">
      <h2 className="commerce-section-title">Delivery details</h2>
      <p className="commerce-section-copy">
        Choose instant delivery or schedule an exact delivery date and time.
      </p>
      <div className="commerce-note mt-4">
        Estimated bakery prep time:{" "}
        {normalizedDeliverySettings.prepTimeMinutes || 45} minutes.
      </div>
      {!normalizedDeliverySettings.enabled && (
        <div className="commerce-alert commerce-alert--danger mt-4">
          Delivery is currently turned off by the bakery. Please try again
          later.
        </div>
      )}
      {normalizedDeliverySettings.isPaused && (
        <div className="commerce-alert commerce-alert--danger mt-4">
          Delivery is temporarily paused until {pauseUntilLabel}.
        </div>
      )}

      <div className="commerce-form-stack">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="commerce-field-label mb-3">Delivery preference</p>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                onChange({ target: { name: "deliveryMode", value: "now" } })
              }
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                !isScheduled
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">
                Deliver Now
              </p>
              <p className="text-xs text-slate-500">
                Fastest possible delivery after prep.
              </p>
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  target: { name: "deliveryMode", value: "scheduled" },
                })
              }
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isScheduled
                  ? "border-fuchsia-300 bg-fuchsia-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">
                Schedule Delivery
              </p>
              <p className="text-xs text-slate-500">
                Choose exact date and time.
              </p>
            </button>
          </div>
        </div>

        {isScheduled && (
          <label className="block">
            <span className="commerce-field-label">
              Exact Delivery Date & Time
            </span>
            <input
              type="datetime-local"
              name="deliveryDateTime"
              value={formData.deliveryDateTime}
              onChange={onChange}
              min={minimumScheduleDateTime}
              required={isScheduled}
              className="commerce-input"
              disabled={!normalizedDeliverySettings.acceptingOrders}
            />
          </label>
        )}

        <label className="block">
          <span className="commerce-field-label">Payment Method</span>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={onChange}
            className="commerce-input"
          >
            <option value="cash">Cash on Delivery</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </label>

        <label className="block">
          <span className="commerce-field-label">Special Instructions</span>
          <textarea
            name="specialInstructions"
            value={formData.specialInstructions}
            onChange={onChange}
            rows={4}
            placeholder="Cake message, design notes, landmark, or anything the bakery should know"
            className="commerce-input"
          />
        </label>
      </div>
    </div>
  );
};

export default OrderDeliveryStep;
