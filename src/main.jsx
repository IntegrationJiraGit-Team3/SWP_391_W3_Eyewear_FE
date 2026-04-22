import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./context/ToastContext";

// Force logout only once per browser session in DEV.
// NOTE: Do NOT do this on every reload, and do NOT do it inside the VNPay popup
// window (that would wipe auth for the whole app because localStorage is shared).
// if (import.meta.env.DEV) {
//   const isVnpayPopup = window.name === "VNPay_Payment";

//   if (!isVnpayPopup) {
//     try {
//       const flagKey = "dev:forceLogoutOnce";
//       const alreadyForced = sessionStorage.getItem(flagKey) === "1";
//       if (!alreadyForced) {
//         sessionStorage.setItem(flagKey, "1");
//         localStorage.removeItem("currentUser");
//         localStorage.removeItem("token");
//         // Notify listeners that rely on storage events.
//         window.dispatchEvent(new Event("storage"));
//       }
//     } catch {
//       // ignore storage errors
//     }
//   }
// }

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
