import { useState } from "react";
import { Button } from "antd";
import { CreateProductBooking } from "../CreateProductBooking/CreateProductBooking";

export function Product({ data }) {
  const [product, setProduct] = useState(data);
  const [globalView, setGlobalView] = useState(false);

  const changeViewButton = (
    <Button size={"default"} onClick={() => setGlobalView(!globalView)}>
      {globalView ? "Скрыть" : "Показать"}
    </Button>
  );

  if (globalView) {
    return (
      <div
        style={{
          border: "2px solid black",
          margin: "10px 5px",
        }}
      >
        <img
          style={{
            width: 120,
            height: 120,
          }}
          src={product.images[0]}
        />
        <div>
          <span>id: {product._id}</span>
          <br />
          <span>microtronId: {product.microtronId}</span>
          <br />
          <span>name: {product.name}</span>
          <br />
          <span>price: {product.ourPrice} грн</span>
          <br />
          <span>quantity: {product.quantity} шт</span>
          <br />
          <span>warranty: {product.warranty} мес</span>
          <br />
          <span>
            url: <a href={product.url}>{product.url}</a>
          </span>
          <br />
          <span>new: {product.new ? "Да" : "Нет"}</span>
          <br />
          <span>available: {product.available ? "Да" : "Нет"}</span>
          <br />
        </div>
        {changeViewButton}
        <CreateProductBooking
          product={product}
          changeProduct={(newData) => setProduct(newData)}
        />
      </div>
    );
  } else {
    return (
      <div
        style={{
          border: "2px solid black",
          margin: "10px 5px",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div>
          <img
            style={{
              width: 75,
              height: 75,
            }}
            src={product.images[0]}
          />
          <span>microtronId: {product.microtronId}</span> |
          <span>price: {product.ourPrice} грн</span> |
          <span>quantity: {product.quantity} шт</span> |{" "}
          <span>name: {product.name}</span>
        </div>
        {changeViewButton}
      </div>
    );
  }
}
