import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0f6cbd",
          colorInfo: "#0f6cbd",
          colorSuccess: "#2f855a",
          colorWarning: "#d97706",
          colorError: "#dc2626",
          borderRadius: 18,
          fontFamily: 'Manrope, "Avenir Next", "Segoe UI", sans-serif',
          colorTextBase: "#0f172a",
          colorBgBase: "#eef3f7",
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
