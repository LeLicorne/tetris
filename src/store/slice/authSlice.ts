import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Auth } from '../../models/auth';
import { UserProfile } from '../../services/authService';

interface AuthState {
  loading: boolean;
  error: string | null;
  access: string | null;
  refresh: string | null;
  user: UserProfile | null;
}

const initialState: AuthState = {
  loading: false,
  error: null,
  access: null,
  refresh: null,
  user: null,
};
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<Auth>) {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh ?? null;
    },
    setUser(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload;
    },
    clearTokens(state) {
      state.access = null;
      state.refresh = null;
      state.user = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setTokens, clearTokens, setUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
