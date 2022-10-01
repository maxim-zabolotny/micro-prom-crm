import React, { useEffect, useState } from "react";
import { useAxios } from "../../../../hooks";
import { FindBookingForm } from "../Forms/FindBookingForm/FindBookingForm";
import { useNavigate } from "react-router-dom";
import { FullBooking } from "../FullBooking/FullBooking";

export function FindBooking({ url, bookingId }) {
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const { data, loading, fetch } = useAxios(
    url,
    {
      method: "get",
      params: {
        id: bookingId,
      },
    },
    Boolean(bookingId)
  );

  useEffect(() => {
    setBooking(data);

    if (data) {
      navigate(`/booking/${data._id}`);
    }
  }, [data]);

  if (loading) {
    return <p>LOADING..</p>;
  }

  const formInfo = (
    <FindBookingForm booking={booking} fetch={(id) => fetch({}, { id })} />
  );

  const bookingInfo = booking ? (
    <FullBooking booking={booking} setBooking={setBooking} />
  ) : null;

  return (
    <div
      style={{
        border: "2px solid black",
        margin: "10px 5px",
        padding: "10px",
      }}
    >
      {formInfo}
      {bookingInfo}
    </div>
  );
}
