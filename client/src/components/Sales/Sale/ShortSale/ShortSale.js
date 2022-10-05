import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import React, { useContext } from "react";
import "./ShortSale.css";
import { dateToStr } from "../../../../utils/date";
import { toHumanReadableStatus } from "../../utils";
import { GlobalContext } from "../../../../contexts/global";
import { UserRole } from "../../../CurrentUser";

export function ShortSale({ sale, changeView }) {
  const { currentUser } = useContext(GlobalContext);
  const navigate = useNavigate();

  const isCurrentUserProvider = [UserRole.Admin, UserRole.Provider].includes(
    currentUser.role
  );

  const { product } = sale;

  const saleDescription = sale.description ? (
    <span>
      <b>Заметки:</b> {sale.description}
    </span>
  ) : null;
  const saleAt = sale.saleAt ? (
    <span>
      <b>Дата продажи:</b>{" "}
      <b style={{ color: "#1890ff" }}>{dateToStr(sale.saleAt)} </b>
    </span>
  ) : null;

  const saleCanceledReason = sale.canceledReason ? (
    <span>
      <b>Причина отказа:</b> {sale.canceledReason}
    </span>
  ) : null;
  const saleCanceledAt = sale.canceledAt ? (
    <span>
      <b>Дата отказа:</b>{" "}
      <b style={{ color: "#1890ff" }}>{dateToStr(sale.canceledAt)}</b>
    </span>
  ) : null;

  const salePaidAt = sale.paidAt ? (
    <span>
      <b>Дата оплаты:</b>{" "}
      <b style={{ color: "#1890ff" }}>{dateToStr(sale.paidAt)}</b>
    </span>
  ) : null;

  const benefitPrice = isCurrentUserProvider ? (
    <span>
      <b>Выгода:</b> <b style={{ color: "#1890ff" }}>{sale.benefitPrice} грн</b>
    </span>
  ) : null;

  const deliveryProviderHumanRead = sale?.delivery?.provider
    ? sale.delivery.provider === "ukrposhta"
      ? "Укр почта"
      : "Новая почта"
    : null;
  const deliveryProvider = deliveryProviderHumanRead ? (
    <span>
      <b>Провайдер:</b> {deliveryProviderHumanRead}
    </span>
  ) : null;

  const deliveryId = sale?.delivery?.declarationId ? (
    <span>
      <b>Номер декларации:</b>{" "}
      <b style={{ color: "#1890ff" }}>{sale?.delivery.declarationId}</b>
    </span>
  ) : null;

  const deliveredAt = sale?.delivery?.time ? (
    <span>
      <b>Дата отправки:</b>{" "}
      <b style={{ color: "#1890ff" }}>{dateToStr(sale?.delivery.time)}</b>
    </span>
  ) : null;

  return (
    <div className={"short-sale-container"}>
      <img className={"short-sale-image"} src={product.images[0]} />
      <div className={"short-sale-main-info"}>
        <div className={"short-sale-product-info"}>
          <p className={"short-sale-item-header"}>Продукт:</p>
          <span>
            <b>Название:</b> {product.name}
          </span>
          <span>
            <b>microtronId:</b> {product.microtronId}
          </span>
        </div>
        <div className={"short-sale-main-info-split-line"} />
        <div className={"short-sale-info"}>
          <p className={"short-sale-item-header"}>Продажа:</p>
          <span>
            <b>Статус:</b>{" "}
            <b style={{ color: "#1890ff" }}>
              {toHumanReadableStatus(sale.status)}
            </b>
          </span>
          <span>
            <b>Колличевство:</b> {sale.count} шт
          </span>
          <span>
            <b>Сумма:</b> {sale.totalPrice} грн
          </span>
          {benefitPrice}
          <span>
            <b>Оплачен:</b>{" "}
            <b style={{ color: "#1890ff" }}>{sale.paid ? "Да" : "Нет"}</b>
          </span>
          {salePaidAt}
          <span>
            <b>Дата создания: </b>
            <b style={{ color: "#1890ff" }}>{dateToStr(sale.createdAt)}</b>
          </span>
          {saleDescription}
          {saleAt}
          {saleCanceledReason}
          {saleCanceledAt}
        </div>
        <div className={"short-sale-main-info-split-line"} />
        <div className={"short-sale-delivery-info"}>
          <p className={"short-sale-item-header"}>Доставка:</p>
          {deliveryProvider}
          {deliveryId}
          {deliveredAt}
        </div>
      </div>
      <div className={"short-sale-buttons"}>
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
        <Button
          size={"default"}
          type={"default"}
          onClick={() => navigate(`/booking/${sale.productBooking}`)}
        >
          Показать Бронирование
        </Button>
        <Button
          size={"default"}
          type={"default"}
          onClick={() => navigate(`/${product._id}`)}
        >
          Показать Продукт
        </Button>
      </div>
    </div>
  );
}
