import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Auth } from '@/models/auth';

interface AuthState {
  loading: boolean;
  error: string | null;
  access: string | null;
  refresh: string | null;
}

const initialState: AuthState = {
  loading: false,
  error: null,
  access: null,
  refresh: null,
};
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<Auth>) {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh ?? null;
    },
    clearTokens(state) {
      state.access = null;
      state.refresh = null;
    },
  },
});

export const { setTokens, clearTokens } = authSlice.actions;
export default authSlice.reducer;
