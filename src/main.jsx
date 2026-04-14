import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom"; // <--- Thêm dòng này
import { GoogleOAuthProvider } from "@react-oauth/google";

import { ToastProvider } from "./context/ToastContext"; // <--- Thêm ToastProvider

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="997278284443-385k2j6oi5mi5va72saaumip6s3i4nhr.apps.googleusercontent.com">
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
