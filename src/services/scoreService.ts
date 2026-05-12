import { collection, addDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface GameScore {
  id?: string;
  userId?: string;
  username: string;
  score: number;
  timestamp: number;
  level?: number;
  lines?: number;
}

const LOCAL_SCORES_KEY = 'tetris-app-scores';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readLocalScores(): GameScore[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const rawScores = window.localStorage.getItem(LOCAL_SCORES_KEY);
    if (!rawScores) {
      return [];
    }

    const parsedScores = JSON.parse(rawScores) as GameScore[];
    return Array.isArray(parsedScores) ? parsedScores : [];
  } catch {
    return [];
  }
}

function writeLocalScores(scores: GameScore[]): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores));
  } catch {
    // Ignore storage failures; Firestore may still succeed.
  }
}

function addLocalScore(score: GameScore): void {
  const scores = readLocalScores();
  const scoreKey = `${score.userId || 'guest'}:${score.username}:${score.score}:${score.timestamp}`;
  const nextScores = scores.filter(
    (entry) =>
      `${entry.userId || 'guest'}:${entry.username}:${entry.score}:${entry.timestamp}` !== scoreKey
  );

  nextScores.push(score);
  writeLocalScores(nextScores);
}

function mergeAndSortScores(remoteScores: GameScore[], localScores: GameScore[]): GameScore[] {
  const mergedScores = [...remoteScores];

  for (const localScore of localScores) {
    const localKey = `${localScore.userId || 'guest'}:${localScore.username}:${localScore.score}:${localScore.timestamp}`;
    const alreadyIncluded = mergedScores.some(
      (entry) =>
        `${entry.userId || 'guest'}:${entry.username}:${entry.score}:${entry.timestamp}` ===
        localKey
    );

    if (!alreadyIncluded) {
      mergedScores.push(localScore);
    }
  }

  return mergedScores.sort((left, right) => right.score - left.score);
}

export const scoreService = {
  async saveScore(gameScore: GameScore): Promise<string> {
    const scoreToSave = {
      ...gameScore,
      timestamp: gameScore.timestamp ?? Date.now(),
    };

    addLocalScore(scoreToSave);

    try {
      const scoresCollection = collection(db, 'scores');
      const docRef = await addDoc(scoresCollection, scoreToSave);
      return docRef.id;
    } catch (error) {
      console.warn('Falling back to local score storage:', error);
      return `local-${scoreToSave.timestamp}`;
    }
  },

  async getTopScores(limitCount: number = 10): Promise<GameScore[]> {
    const localScores = readLocalScores();

    try {
      const scoresCollection = collection(db, 'scores');
      const q = query(scoresCollection, orderBy('score', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      const remoteScores = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as GameScore
      );

      return mergeAndSortScores(remoteScores, localScores).slice(0, limitCount);
    } catch (error) {
      console.warn('Falling back to local leaderboard data:', error);
      return localScores.sort((left, right) => right.score - left.score).slice(0, limitCount);
    }
  },

  async getUserScores(userId: string): Promise<GameScore[]> {
    const localScores = readLocalScores().filter((score) => score.userId === userId);

    try {
      const scoresCollection = collection(db, 'scores');
      const q = query(scoresCollection, where('userId', '==', userId), orderBy('score', 'desc'));
      const querySnapshot = await getDocs(q);
      const remoteScores = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as GameScore
      );

      return mergeAndSortScores(remoteScores, localScores);
    } catch (error) {
      console.warn('Falling back to local user scores:', error);
      return localScores.sort((left, right) => right.score - left.score);
    }
  },

  async getUserBestScore(userId: string): Promise<GameScore | null> {
    const userScores = await this.getUserScores(userId);
    return userScores.length > 0 ? userScores[0] : null;
  },
};
