import { FindProductsForm } from "./FindProductsForm/FindProductsForm";
import { useEffect, useState } from "react";
import _ from "lodash";
import { useAxios } from "../../hooks";
import { GeneralProduct } from "./Product";

export function Products({ url }) {
  const [requestData, setRequestData] = useState({
    offset: 0,
    limit: 30,
    loadedOnProm: true,
  });

  const config = {
    method: "post",
    data: requestData,
  };
  const { data, error, loading, fetch } = useAxios(url, config);

  useEffect(() => {
    fetch();
  }, [config.data]);

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
        fetch={(data) => setRequestData(data)}
        productsSize={(data ?? []).length}
      />
      {loading ? <p>LOADING..</p> : products}
    </div>
  );
}
