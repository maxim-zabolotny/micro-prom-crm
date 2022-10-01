import { useState } from "react";
import { useAxios } from "../../hooks";
import _ from "lodash";
import { ShortBooking } from "./Booking/ShortBooking/ShortBooking";
import { FindBookingsForm } from "./FindBookingsForm/FindBookingsForm";

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
    _.isEmpty(data) || error ? null : (
      <div>
        {data.map((item) => (
          <ShortBooking key={item._id} booking={item} changeView={changeView} />
        ))}
      </div>
    );

  return (
    <div style={{ width: "100%" }}>
      <FindBookingsForm
        data={requestData}
        fetch={(data) => {
          setRequestData(data);
          fetch(data);
        }}
        bookingsSize={(data ?? []).length}
      />
      {loading ? <p>LOADING..</p> : bookings}
    </div>
  );
}
