import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider } from "./context/LoadingContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <LoadingProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LoadingProvider>
    </AuthProvider>
  </React.StrictMode>
);
