import { useContext } from "react";
import { GlobalContext } from "../../contexts/global";
import "./CurrentUser.css";

export function CurrentUser() {
  const { currentUser } = useContext(GlobalContext);

  return (
    <div className={"current-user"}>
      <div className={"current-user-info"}>
        <span>
          <b>Имя:</b> {currentUser.name}
        </span>
        <span>
          <b>Роль:</b> {currentUser.role}
        </span>
      </div>
      <div className={"current-user-line"} />
    </div>
  );
}
