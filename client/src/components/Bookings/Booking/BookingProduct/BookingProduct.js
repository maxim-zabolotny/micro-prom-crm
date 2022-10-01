import React from "react";

export function BookingProduct({ product }) {
  return (
    <div>
      <p>Product</p>
      <img
        style={{
          width: 75,
          height: 75,
        }}
        src={product.image}
      />
      <span>id: {product.id}</span>
      <br />
      <span>microtronId: {product.microtronId}</span>
      <br />
      <span>name: {product.name}</span>
    </div>
  );
}
