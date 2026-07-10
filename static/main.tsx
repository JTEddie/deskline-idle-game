import React from "react";
import { createRoot } from "react-dom/client";
import { DesklineGame } from "../app/components/DesklineGame";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DesklineGame />
  </React.StrictMode>,
);
