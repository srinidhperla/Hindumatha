import test from "node:test";
import assert from "node:assert/strict";
import {
  haversineDistance,
  isWithinDeliveryRadius,
} from "./deliverySettings.js";

const storeLocation = { lat: 18.1067, lng: 83.39 };
const fortCitySchool = { lat: 18.1009852, lng: 83.4227428 };

test("Fort City School stays within 4km delivery radius", () => {
  const distance = haversineDistance(
    storeLocation.lat,
    storeLocation.lng,
    fortCitySchool.lat,
    fortCitySchool.lng,
  );

  assert.ok(distance > 3.3 && distance < 3.7, `Distance was ${distance}`);
  assert.equal(
    isWithinDeliveryRadius(
      storeLocation,
      fortCitySchool.lat,
      fortCitySchool.lng,
      4,
    ),
    true,
  );
});

test("Fort City School fails when radius is below the measured distance", () => {
  assert.equal(
    isWithinDeliveryRadius(
      storeLocation,
      fortCitySchool.lat,
      fortCitySchool.lng,
      3,
    ),
    false,
  );
});

test("Invalid coordinates are never marked serviceable", () => {
  assert.equal(isWithinDeliveryRadius(storeLocation, null, null, 4), false);
  assert.equal(
    isWithinDeliveryRadius(
      { lat: null, lng: 83.39 },
      fortCitySchool.lat,
      fortCitySchool.lng,
      4,
    ),
    false,
  );
});
