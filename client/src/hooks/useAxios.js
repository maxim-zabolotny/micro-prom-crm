import { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../contexts/global";
import axios from "axios";
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

  async function fetch() {
    setLoading(true);

    try {
      const fetchUrl = url.includes("http")
        ? url
        : `${context.serverUrl}${url}`;

      const { data } = await axios.request({
        url: fetchUrl,
        ...config,
        headers: {
          Authorization: `Bearer ${context.authToken}`,
          ...config.headers,
        },
      });

      setData(data);
      setError(null);
    } catch (err) {
      console.error("App Request Error:", err);

      if (isUnauthorizedError(err)) {
        context.resetCreds();
      }

      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return [data, error, loading, fetch];
}
