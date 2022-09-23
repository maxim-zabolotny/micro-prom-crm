import { useContext } from "react";
import { GlobalContext } from "../../contexts/global";

export function CurrentUser() {
  const { currentUser } = useContext(GlobalContext);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <span>Name: {currentUser.name}</span>
      ----|----
      <span>Role: {currentUser.role}</span>
    </div>
  );
}
