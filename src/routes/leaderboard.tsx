import { createFileRoute } from '@tanstack/react-router';
import LeaderboardPage from '../pages/LeaderboardPage';

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
});
