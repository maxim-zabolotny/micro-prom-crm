import { useAxios } from "../../hooks";
import _ from "lodash";
import { ShortClient } from "./Client";
import { FindClientsForm } from "./Forms/FindClientsForm/FindClientsForm";
import { LoaderSpinner } from "../LoaderSpinner/LoaderSpinner";
import "./Clients.css";

export function Clients({ url }) {
  const { data, error, loading, fetch } = useAxios(url, {
    method: "get",
  });

  const clients =
    _.isEmpty(data) || error ? (
      <div className={"clients-empty-result"}>Пусто</div>
    ) : (
      <div className={"clients-list"}>
        {data.map((item) => (
          <ShortClient key={item._id} client={item} />
        ))}
      </div>
    );

  return (
    <div className={"clients-container"}>
      <FindClientsForm
        fetch={(data) => fetch({}, data)}
        clientsSize={(data ?? []).length}
        modifyUrl={true}
        showResult={true}
      />
      {loading ? <LoaderSpinner height={75} width={75} /> : clients}
    </div>
  );
}
