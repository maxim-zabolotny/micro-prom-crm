import { CurrentUser } from "../CurrentUser";
import { Auth } from "../Auth";
import { Navigation } from "../Navigation";
import { Outlet } from "react-router-dom";
import React from "react";
import { NotificationContainer } from "react-notifications";
import "react-notifications/lib/notifications.css";
import "./Main.css";

export function Main() {
  return (
    <Auth>
      <div className={"main"}>
        <CurrentUser />
        <div className={"body"}>
          <Navigation />
          <Outlet />
        </div>
        <NotificationContainer />
      </div>
    </Auth>
  );
}
