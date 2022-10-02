import React, { useEffect, useState } from "react";
import { useAxios } from "../../../../hooks";
import { FindSaleForm } from "../Forms/FindSaleForm/FindSaleForm";
import { useNavigate } from "react-router-dom";
import { FullSale } from "../FullSale/FullSale";

export function FindSale({ url, saleId }) {
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const { data, loading, fetch } = useAxios(
    url,
    {
      method: "get",
      params: {
        id: saleId,
      },
    },
    Boolean(saleId)
  );

  useEffect(() => {
    setSale(data);

    if (data) {
      navigate(`/sale/${data._id}`);
    }
  }, [data]);

  if (loading) {
    return <p>LOADING..</p>;
  }

  const formInfo = (
    <FindSaleForm sale={sale} fetch={(id) => fetch({}, { id })} />
  );

  const saleInfo = sale ? <FullSale sale={sale} setSale={setSale} /> : null;

  return (
    <div
      style={{
        border: "2px solid black",
        margin: "10px 5px",
        padding: "10px",
      }}
    >
      {formInfo}
      {saleInfo}
    </div>
  );
}
