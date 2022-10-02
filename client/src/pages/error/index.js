import { useRouteError } from "react-router-dom";
import "./index.css";

export function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div id="error-page">
      <h1>Уппс!</h1>
      <p>Произошла неожидання ошибка.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}
