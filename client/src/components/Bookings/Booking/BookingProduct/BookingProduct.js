import React from "react";

export function BookingProduct({ product }) {
  return (
    <div>
      <p>Product</p>
      <span>id: {product.id}</span>
      <br />
      <span>microtronId: {product.microtronId}</span>
      <br />
      <span>name: {product.name}</span>
    </div>
  );
}
