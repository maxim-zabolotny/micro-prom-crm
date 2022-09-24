import { CreateProductBooking } from "../../CreateProductBooking/CreateProductBooking";
import { useState } from "react";
import { Button } from "antd";

export function FullProduct({ changeView, ...props }) {
  const [product, setProduct] = useState(props.product);

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
      <Button size={"default"} onClick={changeView}>
        Скрыть
      </Button>
      <CreateProductBooking
        product={product}
        changeProduct={(newData) => setProduct(newData)}
      />
    </div>
  );
}
