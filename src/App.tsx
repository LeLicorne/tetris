import { RouterProvider } from '@tanstack/react-router';
import { router } from './Router';
import './App.css';

export default function App() {
  return <RouterProvider router={router} />;
}
