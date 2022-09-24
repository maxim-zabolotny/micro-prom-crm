import { useContext } from "react";
import { GlobalContext } from "../../contexts/global";

export function CurrentUser() {
  const { currentUser } = useContext(GlobalContext);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <span>Name: {currentUser.name}</span>
      <span>Role: {currentUser.role}</span>
    </div>
  );
}
