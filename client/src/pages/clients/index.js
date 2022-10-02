import React, { useState } from "react";
import { Button } from "antd";
import { RequestAccess } from "../../components/RequestAccess";
import { API_URL } from "../../api/baseURL";
import { Clients } from "../../components/Clients";
import "./clients.css";

export function ClientsPage() {
  const [viewType] = useState("multiple");

  let children;
  switch (viewType) {
    case "multiple": {
      children = (
        <RequestAccess url={API_URL.CLIENTS.SEARCH} showMessage={true}>
          <Clients />
        </RequestAccess>
      );
      break;
    }
    default: {
      throw new Error("Непредвиденная ошибка");
    }
  }

  const buttons = (
    <div className={"clients-page-buttons"}>
      <Button type={"primary"} disabled={true}>
        Поиск
      </Button>
    </div>
  );

  return (
    <div className={"clients-page-container"}>
      {buttons}
      {children}
    </div>
  );
}
