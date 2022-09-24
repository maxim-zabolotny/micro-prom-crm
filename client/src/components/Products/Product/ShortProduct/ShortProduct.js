import { Button } from "antd";

export function ShortProduct({ product, changeView }) {
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
      <Button size={"default"} onClick={changeView}>
        Показать
      </Button>
    </div>
  );
}
