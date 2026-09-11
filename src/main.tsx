import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { CasesProvider } from "./app/cases-context";
import { SyncProvider } from "./app/sync-context";
import { MaterialProvider } from "./app/material-context";
import { router } from "./app/router";
import "./styles/tokens.css";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Application root is missing.");

createRoot(root).render(
  <StrictMode>
    <MaterialProvider>
      <CasesProvider>
        <SyncProvider>
          <RouterProvider router={router} />
        </SyncProvider>
      </CasesProvider>
    </MaterialProvider>
  </StrictMode>,
);
