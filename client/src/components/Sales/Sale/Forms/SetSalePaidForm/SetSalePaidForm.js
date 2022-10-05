import { useAxios } from "../../../../../hooks";
import React, { useEffect, useState } from "react";
import { Checkbox } from "antd";
import { LoaderSpinner } from "../../../../LoaderSpinner/LoaderSpinner";
import { NotificationManager } from "react-notifications";
import { SaleStatus } from "../../../utils";

export function SetSalePaidForm({ url, haveAccess, sale, changeSale }) {
  const [paid, setPaid] = useState(sale.paid);

  const isNotChangeable = [SaleStatus.Sale, SaleStatus.Canceled].includes(
    sale.status
  );

  const { data, loading, fetch } = useAxios(url, {
    method: "put",
  });

  const onChange = (e) => {
    fetch({
      productSaleId: sale._id,
      paid: e.target.checked,
    });
  };

  useEffect(() => {
    if (data) {
      changeSale(data);

      NotificationManager.success(`Успех`, "Статус оплаты изменен", 5000);
    }
  }, [data]);

  useEffect(() => {
    setPaid(sale.paid);
  }, [sale.paid]);

  if (loading) {
    return <LoaderSpinner />;
  }

  return (
    <div
      style={{
        padding: "10px",
        margin: "0 10px",
      }}
    >
      <Checkbox
        checked={paid}
        onChange={onChange}
        disabled={!haveAccess || isNotChangeable}
      >
        Оплачен
      </Checkbox>
    </div>
  );
}
