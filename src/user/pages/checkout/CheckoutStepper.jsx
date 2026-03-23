import React from "react";
import { stepLabels } from "./orderPageUtils";

const CheckoutStepper = ({ step }) => (
  <div className="commerce-stepper">
    {stepLabels.map((label, index) => {
      const currentStep = index + 1;
      return (
        <React.Fragment key={label}>
          <div className="commerce-step">
            <div
              className={`commerce-step-circle ${
                step >= currentStep
                  ? "commerce-step-circle--active"
                  : "commerce-step-circle--inactive"
              }`}
            >
              {currentStep}
            </div>
            <span
              className={`commerce-step-label ${
                step >= currentStep
                  ? "commerce-step-label--active"
                  : "commerce-step-label--inactive"
              }`}
            >
              {label}
            </span>
          </div>
          {currentStep < stepLabels.length && (
            <div
              className={`commerce-step-line ${
                step > currentStep
                  ? "commerce-step-line--active"
                  : "commerce-step-line--inactive"
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default CheckoutStepper;
