import { CreateBookingForm } from "../Forms/CreateBookingForm/CreateBookingForm";
import { Button } from "antd";
import { RequestAccess } from "../../../RequestAccess";
import { API_URL } from "../../../../api/baseURL";
import "./FullProduct.css";
import React from "react";

export function FullProduct({
  changeView,
  changeViewAble,
  product,
  setProduct,
}) {
  const changeViewButton = changeViewAble ? (
    <Button type={"primary"} size={"default"} onClick={changeView}>
      Скрыть
    </Button>
  ) : null;

  return (
    <div className={"full-product-container"}>
      <div className={"full-product"}>
        <img className={"full-product-image"} src={product.images[0]} />
        <div className={"full-product-info"}>
          <span>
            <b>ID:</b> {product._id}
          </span>
          <span>
            <b>microtronId:</b> {product.microtronId}
          </span>
          <span>
            <b>Название:</b> {product.name}
          </span>
          <span>
            <b>Цена:</b> {product.ourPrice} грн
          </span>
          <span>
            <b>Цена Microtron:</b> {product.sitePrice} грн
          </span>
          <span>
            <b>Разница в цене:</b> {product.siteMarkup.toFixed(0)} %
          </span>
          <span>
            <b>Колличевство:</b> {product.quantity} шт
          </span>
          <span>
            <b>Гарантия:</b> {product.warranty} мес
          </span>
          <span>
            <b>Ссылка:</b> <a href={product.url}>Microtron</a>
          </span>
          <span>
            <b>Новый:</b> {product.new ? "Да" : "Нет"}
          </span>
          <span>
            <b>Доступный:</b> {product.available ? "Да" : "Нет"}
          </span>
        </div>
        {changeViewButton}
      </div>
      <div className={"full-products-line"} />
      <RequestAccess url={API_URL.PRODUCT_BOOKINGS.CREATE}>
        <CreateBookingForm
          product={product}
          changeProduct={(newData) => setProduct(newData)}
        />
      </RequestAccess>
    </div>
  );
}
