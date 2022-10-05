import React, { useEffect, useState } from "react";
import { Button, Form, Select } from "antd";
import { BookingStatus } from "../../utils";
import { ApproveBookingForm } from "../Forms/ApproveBookingForm/ApproveBookingForm";
import { RequestAccess } from "../../../RequestAccess";
import { API_URL } from "../../../../api/baseURL";
import { DisapproveBookingForm } from "../Forms/DisapproveBookingForm/DisapproveBookingForm";
import "./FullBooking.css";
import { dateToStr } from "../../../../utils/date";
import { useNavigate } from "react-router-dom";

export function FullBooking({ booking, setBooking }) {
  const navigate = useNavigate();
  const [bookingStatus, setBookingStatus] = useState(booking.status);

  const { product } = booking;

  useEffect(() => {
    if (bookingStatus !== booking.status) {
      setBookingStatus(booking.status);
    }
  }, [booking.status]);

  const isChangeable = booking.status === BookingStatus.Wait;

  const changeBooking = (booking) => {
    setBooking(booking);
    setBookingStatus(booking.status);
  };

  let changeStatusForm;
  let changedBookingInfo;
  switch (bookingStatus) {
    case BookingStatus.Approve: {
      const access = (el) => (
        <RequestAccess url={API_URL.PRODUCT_BOOKINGS.APPROVE}>
          {el}
        </RequestAccess>
      );

      changeStatusForm = access(
        <ApproveBookingForm booking={booking} changeBooking={changeBooking} />
      );

      changedBookingInfo =
        booking.status === bookingStatus
          ? access(
              <span>
                <b>Цена со склада:</b> {booking.rawPrice} грн
              </span>
            )
          : null;
      break;
    }
    case BookingStatus.Disapprove: {
      const access = (el) => (
        <RequestAccess url={API_URL.PRODUCT_BOOKINGS.DISAPPROVE}>
          {el}
        </RequestAccess>
      );

      changeStatusForm = access(
        <DisapproveBookingForm
          booking={booking}
          changeBooking={changeBooking}
        />
      );

      changedBookingInfo =
        booking.status === bookingStatus ? (
          <span>
            <b>Причина отказа:</b> {booking.disapproveReason}
          </span>
        ) : null;
      break;
    }
    default: {
      changeStatusForm = null;
      changedBookingInfo = null;
      break;
    }
  }

  return (
    <div className={"full-booking-container"}>
      <div className={"full-booking"}>
        <img className={"full-booking-image"} src={product.image} />
        <div className={"full-booking-main-info"}>
          <div className={"full-booking-product-info"}>
            <p className={"full-booking-item-header"}>Продукт:</p>
            <span>
              <b>ID:</b> {product.id}
            </span>
            <span>
              <b>Название:</b> {product.name}
            </span>
            <span>
              <b>microtronId:</b> {product.microtronId}
            </span>
            <Button
              size={"default"}
              type={"default"}
              onClick={() => navigate(`/${product.id}`)}
            >
              Показать Продукт
            </Button>
          </div>
          <div className={"full-booking-main-info-split-line"} />
          <div className={"full-booking-info"}>
            <p className={"full-booking-item-header"}>Бронирование:</p>
            <span>
              <b>ID:</b> {booking._id}
            </span>
            <span>
              <b>Колличевство:</b> {booking.count} шт
            </span>
            <span>
              <b>Коментарий:</b> {booking.description}
            </span>
            <span>
              <b>Дата: </b>
              <b style={{ color: "#1890ff" }}>{dateToStr(booking.createdAt)}</b>
            </span>
            {changedBookingInfo}
            <Form.Item label={<b>Статус</b>} wrapperCol={{ span: 10 }}>
              <Select
                name={"status"}
                disabled={!isChangeable}
                value={bookingStatus}
                onSelect={setBookingStatus}
              >
                <Select.Option value={BookingStatus.Wait}>
                  В ожидании
                </Select.Option>
                <Select.Option value={BookingStatus.Approve}>
                  Подтверждён
                </Select.Option>
                <Select.Option value={BookingStatus.Disapprove}>
                  Отклонён
                </Select.Option>
              </Select>
            </Form.Item>
            <div className={"full-booking-main-info-split-line"} />
            {isChangeable ? changeStatusForm : null}
          </div>
        </div>
      </div>
    </div>
  );
}
