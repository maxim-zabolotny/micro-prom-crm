import { useState } from "react";
import { Button } from "antd";

export function Product({ data }) {
  const [globalView, setGlobalView] = useState(false);

  const changeViewButton = (
    <Button size={"default"} onClick={() => setGlobalView(!globalView)}>
      {globalView ? "Скрыть" : "Показать"}
    </Button>
  );

  if (globalView) {
    return (
      <div
        style={{
          border: "2px solid black",
          margin: "10px 5px",
        }}
      >
        <img
          style={{
            width: 120,
            height: 120,
          }}
          src={data.images[0]}
        />
        <div>
          <span>id: {data._id}</span>
          <br />
          <span>microtronId: {data.microtronId}</span>
          <br />
          <span>name: {data.name}</span>
          <br />
          <span>price: {data.ourPrice} грн</span>
          <br />
          <span>quantity: {data.quantity} шт</span>
          <br />
          <span>warranty: {data.warranty} мес</span>
          <br />
          <span>
            url: <a href={data.url}>{data.url}</a>
          </span>
          <br />
          <span>new: {data.new ? "Да" : "Нет"}</span>
          <br />
          <span>available: {data.available ? "Да" : "Нет"}</span>
          <br />
        </div>
        {changeViewButton}
      </div>
    );
  } else {
    return (
      <div
        style={{
          border: "2px solid black",
          margin: "10px 5px",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div>
          <img
            style={{
              width: 75,
              height: 75,
            }}
            src={data.images[0]}
          />
          <span>microtronId: {data.microtronId}</span> |
          <span>price: {data.ourPrice} грн</span> |
          <span>quantity: {data.quantity} шт</span> |{" "}
          <span>name: {data.name}</span>
        </div>
        {changeViewButton}
      </div>
    );
  }
}
