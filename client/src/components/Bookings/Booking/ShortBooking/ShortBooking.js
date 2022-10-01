import { Button } from "antd";
import { useNavigate } from "react-router-dom";

export function ShortBooking({ booking, changeView }) {
  const navigate = useNavigate();

  const { product } = booking;

  const bookingDescription = booking.description ? (
    <span>description: {booking.description}</span>
  ) : null;
  const bookingDisapproveReason = booking.disapproveReason ? (
    <span>disapprove reason: {booking.disapproveReason}</span>
  ) : null;

  const bookingInfo = (
    <div>
      <span>
        status: <b>{booking.status}</b>
      </span>{" "}
      |<span>count: {booking.count}</span>{" "}
      <span>count: {booking.count} шт</span> | |
      <span>date: {booking.createdAt}</span> | {bookingDescription}
      {bookingDisapproveReason}
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
    </div>
  );

  const productInfo = (
    <div>
      <span>microtronId: {product.microtronId}</span> |
      <span>name: {product.name}</span>
      <Button
        size={"default"}
        type={"default"}
        onClick={() => navigate(`/${product.id}`)}
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
      {bookingInfo}
      <hr />
      {productInfo}
    </div>
  );
}
