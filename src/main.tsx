import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/oswald/latin-500.css";
import "@fontsource/oswald/latin-600.css";
import "@fontsource/oswald/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/noto-sans-thai/thai-400.css";
import "@fontsource/noto-sans-thai/thai-500.css";
import { App } from "./app/App";
import "./styles/theme.css";
import "./styles/global.css";
import "./features/landing/landing.css";
import "./features/landing/rackHero.css";
import "./features/landing/studio.css";
import "./styles/spatialUi.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
