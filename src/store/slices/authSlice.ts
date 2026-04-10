import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Role = 'super_admin' | 'manager' | 'authorizer' | 'marketer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId?: string;
  organizationName?: string;
  branch?: string;
  avatar: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
