import { useAxios } from "../../../../../hooks";
import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { RequestAccess } from "../../../../RequestAccess";
import { API_URL } from "../../../../../api/baseURL";
import { SelectClient } from "./SelectClient/SelectClient";
import { LoaderSpinner } from "../../../../LoaderSpinner/LoaderSpinner";
import { NotificationManager } from "react-notifications";

export function SetSaleClientForm({ url, haveAccess, sale, changeSale }) {
  const [client, setClient] = useState(sale.client);

  const { data, loading, fetch } = useAxios(url, {
    method: "put",
  });

  const onSubmit = () => {
    fetch({
      productSaleId: sale._id,
      promClientId: client.id,
      promClientName: client.client_full_name ?? client.name,
      promClientEmails: client.emails ?? [],
      promClientPhones: client.emails ?? [],
    });
  };

  useEffect(() => {
    if (data) {
      changeSale(data);

      NotificationManager.success(`Успех`, "Клиент сохранен", 5000);
    }
  }, [data]);

  if (loading) {
    return <LoaderSpinner />;
  }

  return (
    <div
      style={{
        border: "2px solid black",
        padding: "10px",
        width: "100%",
        margin: "10px",
      }}
    >
      <RequestAccess url={API_URL.CLIENTS.SEARCH} showMessage={true}>
        <SelectClient client={client} setClient={setClient} />
      </RequestAccess>
      <Button
        type="primary"
        htmlType="submit"
        onClick={onSubmit}
        disabled={!haveAccess || !client}
      >
        Сохранить
      </Button>
    </div>
  );
}
