import { useAxios } from "../../hooks";
import _ from "lodash";
import { ShortClient } from "./Client";
import { FindClientsForm } from "./Forms/FindClientsForm/FindClientsForm";

export function Clients({ url }) {
  const { data, error, loading, fetch } = useAxios(url, {
    method: "get",
  });

  const clients =
    _.isEmpty(data) || error ? null : (
      <div>
        {data.map((item) => (
          <ShortClient key={item._id} client={item} />
        ))}
      </div>
    );

  return (
    <div style={{ width: "100%" }}>
      <FindClientsForm
        fetch={(data) => fetch({}, data)}
        clientsSize={(data ?? []).length}
        modifyUrl={true}
        showResult={true}
      />
      {loading ? <p>LOADING..</p> : clients}
    </div>
  );
}
