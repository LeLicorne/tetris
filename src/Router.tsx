import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Create the router with the automatically generated route tree
export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => (
    <div className="p-4 text-white">
      <h1>Page Not Found</h1>
      <p>
        <a href="/" className="text-blue-400">
          Return to Home
        </a>
      </p>
    </div>
  ),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
