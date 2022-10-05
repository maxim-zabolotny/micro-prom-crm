import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import React from "react";
import { dateToStr } from "../../../../utils/date";
import "./ShortBooking.css";
import { toHumanReadableStatus } from "../../utils";

export function ShortBooking({ booking, changeView }) {
  const navigate = useNavigate();

  const { product } = booking;

  const bookingDescription = booking.description ? (
    <span>
      <b>Комментарий:</b> {booking.description}
    </span>
  ) : null;
  const bookingDisapproveReason = booking.disapproveReason ? (
    <span>
      <b>Причина отказа:</b> {booking.disapproveReason}
    </span>
  ) : null;

  return (
    <div className={"short-booking-container"}>
      <img className={"short-booking-image"} src={product.image} />
      <div className={"short-booking-main-info"}>
        <div className={"short-booking-product-info"}>
          <p className={"short-booking-item-header"}>Продукт:</p>
          <span>
            <b>Название:</b> {product.name}
          </span>
          <span>
            <b>microtronId:</b> {product.microtronId}
          </span>
        </div>
        <div className={"short-booking-main-info-split-line"} />
        <div className={"short-booking-info"}>
          <p className={"short-booking-item-header"}>Бронирование:</p>
          <span>
            <b>Статус: </b>
            <b style={{ color: "#1890ff" }}>
              {toHumanReadableStatus(booking.status)}
            </b>
          </span>
          <span>
            <b>Колличевство:</b> {booking.count} шт
          </span>
          <span>
            <b>Дата бронирования: </b>
            <b style={{ color: "#1890ff" }}>{dateToStr(booking.createdAt)}</b>
          </span>
          {bookingDescription}
          {bookingDisapproveReason}
        </div>
      </div>
      <div className={"short-booking-buttons"}>
        <Button
          size={"default"}
          type={"primary"}
          onClick={() => {
            navigate(`/booking/${booking._id}`);
            changeView(booking._id);
          }}
        >
          Показать Бронирование
        </Button>
        <Button
          size={"default"}
          type={"default"}
          onClick={() => navigate(`/${product.id}`)}
        >
          Показать Продукт
        </Button>
      </div>
    </div>
  );
}
