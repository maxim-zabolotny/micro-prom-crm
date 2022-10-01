/*external modules*/
import React from "react";
/*utils*/
/*styles*/
import "./App.css";
import { Main } from "./components/Main";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorPage } from "./pages/error";
import { ProductsPage } from "./pages/products";
import { BookingsPage } from "./pages/bookings";
import { ClientsPage } from "./pages/clients";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        loader: ({ params }) => ({ id: params["*"] }),
        element: <ProductsPage />,
      },
      {
        path: "/:id",
        loader: ({ params }) => ({ id: params["id"] }),
        element: <ProductsPage />,
      },
      {
        path: "/booking/*",
        loader: ({ params }) => ({ id: params["*"] }),
        element: <BookingsPage />,
      },
      {
        path: "/sale/*",
        loader: ({ params }) => ({ id: params["*"] }),
        element: <div>Продажи</div>,
      },
      {
        path: "/client",
        element: <ClientsPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
