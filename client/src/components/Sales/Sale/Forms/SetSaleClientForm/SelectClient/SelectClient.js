import { useAxios } from "../../../../../../hooks";
import _ from "lodash";
import { FindClientsForm } from "../../../../../Clients";
import { Select } from "antd";
import React from "react";
import { LoaderSpinner } from "../../../../../LoaderSpinner/LoaderSpinner";

export function SelectClient({ url, client, setClient }) {
  const { data, error, loading, fetch } = useAxios(url, {
    method: "get",
  });

  const selectClients = (clients) => (
    <Select
      name={"client"}
      value={client?.id}
      onSelect={(clientId) =>
        setClient(data.find((client) => client.id === clientId))
      }
      style={{ width: "100%" }}
    >
      {clients}
    </Select>
  );

  const buildClientsList = (clients) => {
    return clients.map((item) => {
      const phones = !_.isEmpty(item.phones) ? (
        <span style={{ marginRight: "10px" }}>
          <b>Phones:</b> {item.phones.join(", ")}
        </span>
      ) : null;

      const emails = !_.isEmpty(item.emails) ? (
        <span>
          <b>Emails:</b> {item.emails.join(", ")}
        </span>
      ) : null;

      return (
        <Select.Option
          key={item.id}
          value={item.id}
          style={{ display: "flex", justifyContent: "space-around" }}
        >
          <span style={{ marginRight: "10px" }}>
            <b>name:</b> {item.client_full_name ?? item.name}
          </span>
          {phones}
          {emails}
        </Select.Option>
      );
    });
  };

  const defaultClient = client ? buildClientsList([client]) : <div>Пусто</div>;

  const clients =
    _.isEmpty(data) || error
      ? selectClients(defaultClient)
      : selectClients(buildClientsList(data));

  return (
    <div style={{ width: "100%", margin: "10px" }}>
      <FindClientsForm
        fetch={(data) => fetch({}, data)}
        clientsSize={(data ?? []).length}
        modifyUrl={false}
        showResult={false}
      />
      {loading ? <LoaderSpinner height={45} width={45} /> : clients}
    </div>
  );
}
