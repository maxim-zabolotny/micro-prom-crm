import React, { useEffect, useState } from "react";
import { useAxios } from "../../../../hooks";
import { FindSaleForm } from "../Forms/FindSaleForm/FindSaleForm";
import { useNavigate } from "react-router-dom";
import { FullSale } from "../FullSale/FullSale";
import { LoaderSpinner } from "../../../LoaderSpinner/LoaderSpinner";
import "./FindSale.css";

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
    return <LoaderSpinner height={75} width={75} />;
  }

  const formInfo = (
    <FindSaleForm sale={sale} fetch={(id) => fetch({}, { id })} />
  );

  const saleInfo = sale ? <FullSale sale={sale} setSale={setSale} /> : null;

  return (
    <div className={"find-sale-container"}>
      {formInfo}
      {saleInfo}
    </div>
  );
}
