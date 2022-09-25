import { FindProductsForm } from "./FindProductsForm/FindProductsForm";
import { useEffect, useState } from "react";
import _ from "lodash";
import { useAxios, useRequestAccess } from "../../hooks";
import { API_URL } from "../../api/baseURL";
import { GeneralProduct } from "./Product";

const REQUEST_URL = API_URL.PRODUCTS.SEARCH;

export function Products() {
  const [userHaveAccess, errorAccessMessage] = useRequestAccess(REQUEST_URL);

  const [requestData, setRequestData] = useState({
    offset: 0,
    limit: 30,
    loadedOnProm: true,
  });

  const config = {
    method: "post",
    data: requestData,
  };
  const { data, error, loading, fetch } = useAxios(REQUEST_URL, config);

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

  return userHaveAccess ? (
    <div style={{ width: "100%" }}>
      <FindProductsForm
        data={requestData}
        fetch={(data) => setRequestData(data)}
        productsSize={(data ?? []).length}
      />
      {loading ? <p>LOADING..</p> : products}
    </div>
  ) : (
    errorAccessMessage
  );
}
