import { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../contexts/global";
import axios from "axios";
import { NotificationManager } from "react-notifications";
import { isUnauthorizedError } from "../utils";

export function useAxios(url, config, initFetch = false) {
  const context = useContext(GlobalContext);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initFetch) {
      fetch();
    }
  }, []);

  async function fetch(reqData, reqParams) {
    setLoading(true);

    try {
      const fetchUrl = url.includes("http")
        ? url
        : `${context.serverUrl}${url}`;

      const reqConfig = {
        url: fetchUrl,
        ...config,
        headers: {
          Authorization: `Bearer ${context.authToken}`,
          ...config.headers,
        },
      };

      if (reqData) {
        reqConfig.data = reqData;
      }

      if (reqParams) {
        reqConfig.params = reqParams;
      }

      const { data } = await axios.request(reqConfig);

      setData(data);
      setError(null);
    } catch (err) {
      console.error("App Request Error:", err);

      if (isUnauthorizedError(err)) {
        context.resetCreds();
      }

      if (err.response) {
        const { response } = err;

        const code = response.status;
        const text = response?.data?.message ?? response.statusText;

        NotificationManager.error(`Ошибка`, `${code} - ${text}`, 12000);
      }

      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return {
    data,
    error,
    loading,
    fetch,
  };
}
