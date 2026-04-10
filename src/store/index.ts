import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import finConUiReducer from './slices/finConUiSlice';
import lookupsReducer from './slices/lookupsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    finConUi: finConUiReducer,
    lookups: lookupsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
