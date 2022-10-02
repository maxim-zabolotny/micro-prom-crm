import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

export function SaleProduct({ product }) {
  const navigate = useNavigate();

  return (
    <div>
      <p>Product</p>
      <img
        style={{
          width: 75,
          height: 75,
        }}
        src={product.images[0]}
      />
      <span>id: {product.id}</span>
      <br />
      <span>microtronId: {product.microtronId}</span>
      <br />
      <span>name: {product.name}</span>
      <Button
        size={"default"}
        type={"default"}
        onClick={() => navigate(`/${product._id}`)}
      >
        Показать Продукт
      </Button>
    </div>
  );
}
