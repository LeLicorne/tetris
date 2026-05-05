import { createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  beforeLoad: () => {
    window.scrollTo(0, 0);
  },
  pendingComponent: () => {
    return <div>Loading...</div>;
  },
  notFoundComponent: () => {
    <p>Erreur 404</p>;
  },
  errorComponent: () => {
    return <div>Error</div>;
  },
});
