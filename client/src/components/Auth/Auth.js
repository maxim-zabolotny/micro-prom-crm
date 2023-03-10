/*external modules*/
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
/*utils*/
/*styles*/
/*api*/
import { API_URL } from "../../api/baseURL";
import { GlobalContext } from "../../contexts/global";
import { isUnauthorizedError } from "../../utils";
import { NotificationManager } from "react-notifications";

const SERVER_URL_KEY = "serverUrl";
const AUTH_TOKEN_KEY = "authToken";

export function Auth({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const [queryToken, queryServerUrl] = [
      searchParams.get("token"),
      searchParams.get("server_url"),
    ];

    let authToken;
    let serverUrl;

    if (queryToken && queryServerUrl) {
      authToken = queryToken;
      serverUrl = queryServerUrl;

      setSearchParams("");
    } else {
      ({ authToken, serverUrl } = getLocalCreds());
    }

    setCreds(serverUrl, authToken);
    getCurrentUser(serverUrl, authToken);
  }, []);

  function getLocalCreds() {
    return {
      serverUrl: localStorage.getItem(SERVER_URL_KEY),
      authToken: localStorage.getItem(AUTH_TOKEN_KEY),
    };
  }

  function setCreds(serverUrl, authToken) {
    if (serverUrl) {
      localStorage.setItem(SERVER_URL_KEY, serverUrl);
      setServerUrl(serverUrl);
    }

    if (authToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, authToken);
      setAuthToken(authToken);
    }
  }

  function resetCreds() {
    localStorage.removeItem(SERVER_URL_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);

    setServerUrl(null);
    setAuthToken(null);
    setCurrentUser(null);
  }

  async function getCurrentUser(serverUrl, authToken) {
    if (!serverUrl && !authToken) return;

    const url = `${serverUrl}${API_URL.USERS.BASE}`;

    try {
      const { data } = await axios.get(`${url}/current`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setCurrentUser(data);
    } catch (err) {
      console.error("App Request Error:", err);

      if (isUnauthorizedError(err)) {
        NotificationManager.error(
          `???????????? ??????????????????????`,
          <>
            ?????????????????? <b>???????????? ?????? ??????????????????????</b> ?? Telegram Bot -{" "}
            <b>/get_login_url</b>
          </>,
          12000
        );

        resetCreds();
      }
    }
  }

  if (serverUrl && authToken && currentUser) {
    return (
      <GlobalContext.Provider
        value={{
          currentUser,
          serverUrl,
          authToken,
          getLocalCreds,
          setCreds,
          resetCreds,
          getCurrentUser,
        }}
      >
        {children}
      </GlobalContext.Provider>
    );
  } else {
    return (
      <div>
        <p>???????????? ??????????????????????</p>
        <p>
          ?????????????????? <b>???????????? ?????? ??????????????????????</b> ?? Telegram Bot -{" "}
          <b>/get_login_url</b>
        </p>
      </div>
    );
  }
}
