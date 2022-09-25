import { useRequestAccess } from "../../hooks";
import React from "react";

export function RequestAccess({ url, showMessage, children }) {
  const [userHaveAccess, errorAccessMessage] = useRequestAccess(url);

  const message = showMessage ? errorAccessMessage : null;
  const clone = React.cloneElement(children, {
    ...children.props,
    url,
  });

  return userHaveAccess ? clone : message;
}
