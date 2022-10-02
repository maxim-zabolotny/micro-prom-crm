import { Button } from "antd";
import "./ShortProduct.css";

export function ShortProduct({ product, changeView }) {
  return (
    <div className={"short-product-container"}>
      <div className={"short-product"}>
        <img className={"short-product-image"} src={product.images[0]} />
        <div className={"short-product-info"}>
          <span>
            <b>Название:</b> {product.name}
          </span>
          <span>
            <b>Цена:</b> {product.ourPrice} грн
          </span>
          <span>
            <b>Колличевство:</b> {product.quantity} шт
          </span>
          <span>
            <b>microtronId:</b> {product.microtronId}
          </span>
        </div>
      </div>
      <Button type={"primary"} size={"default"} onClick={changeView}>
        Создать бронирование
      </Button>
    </div>
  );
}
