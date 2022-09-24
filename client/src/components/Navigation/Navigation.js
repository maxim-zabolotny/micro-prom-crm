import { Link } from "react-router-dom";

export function Navigation() {
  return (
    <div
      style={{
        height: "100%",
        width: "300px",
        backgroundColor: "aqua",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Link to={`/`}>Продукты</Link>
      <Link to={`/booking`}>Бронирование</Link>
      <Link to={`/sale`}>Продажи</Link>
      <Link to={`/client`}>Клиенты</Link>
    </div>
  );
}
