import { useState } from "react";
import { useAxios } from "../../hooks";
import _ from "lodash";
import { ShortBooking } from "./Booking";
import { FindBookingsForm } from "./Forms/FindBookingsForm/FindBookingsForm";
import { LoaderSpinner } from "../LoaderSpinner/LoaderSpinner";
import "./Bookings.css";

export function Bookings({ url, changeView }) {
  const [requestData, setRequestData] = useState({
    offset: 0,
    limit: 10,
  });

  const { data, error, loading, fetch } = useAxios(url, {
    method: "post",
    data: requestData,
  });

  const bookings =
    _.isEmpty(data) || error ? (
      <div className={"bookings-empty-result"}>Пусто</div>
    ) : (
      <div className={"bookings-list"}>
        {data.map((item) => (
          <ShortBooking key={item._id} booking={item} changeView={changeView} />
        ))}
      </div>
    );

  return (
    <div className={"bookings-container"}>
      <FindBookingsForm
        data={requestData}
        fetch={(data) => {
          setRequestData(data);
          fetch(data);
        }}
        bookingsSize={(data ?? []).length}
      />
      {loading ? <LoaderSpinner height={75} width={75} /> : bookings}
    </div>
  );
}
