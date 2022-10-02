import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import React from "react";

export function ShortSale({ sale, changeView }) {
  const navigate = useNavigate();

  const { product } = sale;

  const saleDescription = sale.description ? (
    <span>description: {sale.description}</span>
  ) : null;
  const saleAt = sale.saleAt ? <span>sale at: {sale.saleAt}</span> : null;

  const saleCanceledReason = sale.canceledReason ? (
    <span>canceled reason: {sale.canceledReason}</span>
  ) : null;
  const saleCanceledAt = sale.canceledAt ? (
    <span>canceled at: {sale.canceledAt}</span>
  ) : null;

  const saleInfo = (
    <div>
      <span>
        status: <b>{sale.status}</b>
      </span>{" "}
      |<span>count: {sale.count}</span>{" "}
      <span>total price: {sale.totalPrice}</span>
      <span>date: {sale.createdAt}</span>
      {saleDescription}
      {saleAt}
      <div>
        {saleCanceledReason}
        {saleCanceledAt}
      </div>
      <Button
        size={"default"}
        type={"primary"}
        onClick={() => {
          navigate(`/sale/${sale._id}`);
          changeView(sale._id);
        }}
      >
        Показать Продажу
      </Button>
    </div>
  );

  const productInfo = (
    <div>
      <img
        style={{
          width: 75,
          height: 75,
        }}
        src={product.images[0]}
      />
      <span>microtronId: {product.microtronId}</span> |
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

  return (
    <div
      style={{
        border: "2px solid black",
        margin: "10px 5px",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {saleInfo}
      <hr />
      {productInfo}
    </div>
  );
}
