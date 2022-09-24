/*external modules*/
import React from "react";
/*utils*/
/*styles*/
import "./App.css";
import { Main } from "./components/Main";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorPage } from "./pages/error";
import { ProductsPage } from "./pages/products";

// export function Booking() {
//   const loaderData = useLoaderData();
//
//   return (
//     <>
//       <div>Бронирование - {JSON.stringify(loaderData)}</div>
//     </>
//   );
// }

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <ProductsPage />,
      },
      {
        path: "/booking/*",
        loader: ({ params }) => ({ id: params["*"] }),
        element: <div>Бронирование</div>,
      },
      {
        path: "/sale/*",
        loader: ({ params }) => ({ id: params["*"] }),
        element: <div>Продажи</div>,
      },
      {
        path: "/client",
        element: <div>Клиенты</div>,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
