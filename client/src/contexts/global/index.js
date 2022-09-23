/*external modules*/
import React from "react";
/*api*/

export const GlobalContext = React.createContext({
  currentUser: null,
  serverUrl: null,
  authToken: null,
  getLocalCreds() {},
  setCreds(serverUrl, authToken) {},
  resetCreds() {},
  async getCurrentUser(serverUrl, authToken) {},
});

GlobalContext.displayName = "Global";
