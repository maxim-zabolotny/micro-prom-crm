import { CurrentUser } from "../CurrentUser";
import { Auth } from "../Auth";
import { Navigation } from "../Navigation";
import { Outlet } from "react-router-dom";
import React from "react";

export function Main() {
  return (
    <Auth>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <CurrentUser />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            height: "100%",
          }}
        >
          <Navigation />
          <Outlet />
        </div>
      </div>
    </Auth>
  );
}
