import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

export function BookingProduct({ product }) {
  const navigate = useNavigate();

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
      <Button
        size={"default"}
        type={"default"}
        onClick={() => navigate(`/${product.id}`)}
      >
        Показать Продукт
      </Button>
    </div>
  );
}
