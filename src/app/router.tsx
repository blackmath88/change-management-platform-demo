import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Root } from "../pages/root";
import { Portfolio } from "../pages/portfolio";
import { CaseLayout } from "../pages/case-layout";
import { CaseOverview } from "../pages/case-overview";
import { CaseHistory } from "../pages/case-history";
import { CaseBriefPage } from "../pages/case-brief";
import { WorkspacePage } from "../pages/workspace";
import { NotFound } from "../pages/not-found";
import type { WorkspaceKey } from "../domain/case";

const rootRoute = createRootRoute({
  component: Root,
  notFoundComponent: NotFound,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Portfolio,
});

export const caseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cases/$caseId",
  component: CaseLayout,
});

const caseOverviewRoute = createRoute({
  getParentRoute: () => caseRoute,
  path: "/",
  component: CaseOverview,
});

const caseHistoryRoute = createRoute({
  getParentRoute: () => caseRoute,
  path: "history",
  component: CaseHistory,
});

const caseBriefRoute = createRoute({
  getParentRoute: () => caseRoute,
  path: "brief",
  component: CaseBriefPage,
});

function workspaceRoute(path: WorkspaceKey) {
  return createRoute({
    getParentRoute: () => caseRoute,
    path,
    component: () => <WorkspacePage workspace={path} />,
  });
}

const routeTree = rootRoute.addChildren([
  portfolioRoute,
  caseRoute.addChildren([
    caseOverviewRoute,
    workspaceRoute("direction"),
    workspaceRoute("dynamics"),
    workspaceRoute("influence"),
    workspaceRoute("narrative"),
    workspaceRoute("experiments"),
    workspaceRoute("differences"),
    caseHistoryRoute,
    caseBriefRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
