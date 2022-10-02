import { useState } from "react";
import { useAxios } from "../../hooks";
import _ from "lodash";
import { FindSalesForm } from "./Forms/FindSalesForm/FindSalesForm";
import { ShortSale } from "./Sale";

export function Sales({ url, changeView }) {
  const [requestData, setRequestData] = useState({
    offset: 0,
    limit: 10,
  });

  const { data, error, loading, fetch } = useAxios(url, {
    method: "post",
    data: requestData,
  });

  const sales =
    _.isEmpty(data) || error ? null : (
      <div>
        {data.map((item) => (
          <ShortSale key={item._id} sale={item} changeView={changeView} />
        ))}
      </div>
    );

  return (
    <div style={{ width: "100%" }}>
      <FindSalesForm
        data={requestData}
        fetch={(data) => {
          setRequestData(data);
          fetch(data);
        }}
        salesSize={(data ?? []).length}
      />
      {loading ? <p>LOADING..</p> : sales}
    </div>
  );
}
