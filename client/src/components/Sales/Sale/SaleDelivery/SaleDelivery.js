import React from "react";

export function SaleDelivery({ delivery }) {
  return (
    <div>
      <p>Delivery</p>
      <span>declarationId: {delivery.declarationId}</span>
      <br />
      <span>provider: {delivery.provider}</span>
      <br />
      <span>time: {delivery.time}</span>
    </div>
  );
}
