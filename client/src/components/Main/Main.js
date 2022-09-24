import { CurrentUser } from "../CurrentUser";

export function Main({ children }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CurrentUser />
      <p
        style={{
          height: "200px",
          margin: "30px 0",
          backgroundColor: "aqua",
        }}
      ></p>
      {children}
    </div>
  );
}
