import { configureStore } from '@reduxjs/toolkit';
import crmReducer from './crmSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    crm: crmReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
