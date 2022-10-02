import { Oval } from "react-loader-spinner";
import "./LoaderSpinner.css";

export function LoaderSpinner({ width = 50, height = 50 }) {
  return (
    <div className={"loader-spinner"}>
      <Oval
        ariaLabel="loading-indicator"
        height={height}
        width={width}
        strokeWidth={5}
        strokeWidthSecondary={1}
        color="#1890ff"
        secondaryColor="white"
      />
    </div>
  );
}
