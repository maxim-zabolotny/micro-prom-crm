import { useContext } from "react";
import { GlobalContext } from "../contexts/global";
import { API_URL } from "../api/baseURL";

export function useRequestAccess(path) {
  const { currentUser } = useContext(GlobalContext);
  const permissions = API_URL.getPermissions(path);

  const haveAccess = permissions.some((role) => role === currentUser.role);
  const message = <p>У вас недостаточно прав доступа</p>;

  return [haveAccess, message];
}
