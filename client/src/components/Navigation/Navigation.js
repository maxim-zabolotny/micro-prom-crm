import { Link } from "react-router-dom";
import "./Navigation.css";

export function Navigation() {
  return (
    <div className={"navigation"}>
      <div className={"navigation-container"}>
        <Link to={`/`}>Продукты</Link>
        <Link to={`/booking`}>Бронирование</Link>
        <Link to={`/sale`}>Продажи</Link>
        <Link to={`/client`}>Клиенты</Link>
      </div>
      <div className={"navigation-line"} />
    </div>
  );
}
