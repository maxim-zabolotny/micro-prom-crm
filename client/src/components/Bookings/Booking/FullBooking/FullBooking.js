import React, { useEffect, useState } from "react";
import { Form, Select } from "antd";
import { BookingStatus } from "../../utils";
import { ApproveBookingForm } from "../Froms/ApproveBookingForm/ApproveBookingForm";
import { BookingProduct } from "../BookingProduct/BookingProduct";
import { RequestAccess } from "../../../RequestAccess";
import { API_URL } from "../../../../api/baseURL";
import { DisapproveBookingForm } from "../Froms/DisapproveBookingForm/DisapproveBookingForm";

export function FullBooking({ booking, setBooking }) {
  const [bookingStatus, setBookingStatus] = useState(booking.status);

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
              <div
                style={{
                  border: "2px solid black",
                  margin: "5px",
                }}
              >
                <span>rawPrice: {booking.rawPrice}</span>
                <br />
              </div>
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
          <div
            style={{
              border: "2px solid black",
              margin: "5px",
            }}
          >
            <span>disapproveReason: {booking.disapproveReason}</span>
            <br />
          </div>
        ) : null;
      break;
    }
    default: {
      changeStatusForm = null;
      changedBookingInfo = null;
      break;
    }
  }

  const bookingInfo = (
    <>
      <p>Booking</p>
      <span>id: {booking._id}</span>
      <br />
      <Form.Item
        label={"status"}
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
      >
        <Select
          name={"status"}
          disabled={!isChangeable}
          value={bookingStatus}
          onSelect={setBookingStatus}
        >
          <Select.Option value={BookingStatus.Wait}>В ожидании</Select.Option>
          <Select.Option value={BookingStatus.Approve}>
            Подтверждён
          </Select.Option>
          <Select.Option value={BookingStatus.Disapprove}>
            Отклонён
          </Select.Option>
        </Select>
      </Form.Item>
      <span>count: {booking.count}</span>
      <br />
      <span>description: {booking.description}</span>
      <br />
      <span>created: {booking.createdAt}</span>
      <br />
      {isChangeable ? changeStatusForm : null}
    </>
  );

  const productInfo = <BookingProduct product={booking.product} />;

  return (
    <div
      style={{
        border: "2px solid black",
        margin: "10px 5px",
        padding: "10px",
      }}
    >
      {bookingInfo}
      {changedBookingInfo}
      <hr />
      {productInfo}
    </div>
  );
}
