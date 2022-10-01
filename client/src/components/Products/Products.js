import { FindProductsForm } from "./Forms/FindProductsForm/FindProductsForm";
import { useState } from "react";
import _ from "lodash";
import { useAxios } from "../../hooks";
import { GeneralProduct } from "./Product";

export function Products({ url }) {
  const [requestData, setRequestData] = useState({
    offset: 0,
    limit: 30,
    loadedOnProm: true,
  });

  const { data, error, loading, fetch } = useAxios(url, {
    method: "post",
    data: requestData,
  });

  const products =
    _.isEmpty(data) || error ? null : (
      <div>
        {data.map((item) => (
          <GeneralProduct key={item._id} product={item} />
        ))}
      </div>
    );

  return (
    <div style={{ width: "100%" }}>
      <FindProductsForm
        data={requestData}
        fetch={(data) => {
          setRequestData(data);
          fetch(data);
        }}
        productsSize={(data ?? []).length}
      />
      {loading ? <p>LOADING..</p> : products}
    </div>
  );
}
