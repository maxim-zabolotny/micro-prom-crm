import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { Button } from "antd";
import { RequestAccess } from "../../components/RequestAccess";
import { API_URL } from "../../api/baseURL";
import { Bookings, FindBooking } from "../../components/Bookings";

export function BookingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const loaderData = useLoaderData();

  const [viewType, setViewType] = useState(
    loaderData.id ? "single" : "multiple"
  );
  const [bookingId, setBookingId] = useState(loaderData.id);

  const changeView = (viewType) => {
    return () => {
      setViewType(viewType);

      if (viewType === "multiple") {
        navigate(`/booking${location.search}`);
        setBookingId(null);
      }
    };
  };

  let children;
  switch (viewType) {
    case "single": {
      children = (
        <RequestAccess url={API_URL.PRODUCT_BOOKINGS.BASE} showMessage={true}>
          <FindBooking bookingId={bookingId} />
        </RequestAccess>
      );
      break;
    }
    case "multiple": {
      children = (
        <RequestAccess url={API_URL.PRODUCT_BOOKINGS.SEARCH} showMessage={true}>
          <Bookings
            changeView={(bookingId) => {
              setViewType("single");
              setBookingId(bookingId);
            }}
          />
        </RequestAccess>
      );
      break;
    }
    default: {
      throw new Error("Непредвиденная ошибка");
    }
  }

  const buttons = (
    <div style={{ margin: "10px" }}>
      <Button
        style={{ marginRight: "10px" }}
        type={viewType === "single" ? "primary" : "default"}
        onClick={changeView("single")}
      >
        Бронирование
      </Button>

      <Button
        type={viewType === "multiple" ? "primary" : "default"}
        onClick={changeView("multiple")}
      >
        Поиск
      </Button>
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      {buttons}
      {children}
    </div>
  );
}
