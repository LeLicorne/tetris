import { combineReducers } from '@reduxjs/toolkit';

import authReducer from './slice/authSlice';

const rootReducers = combineReducers({
  auth: authReducer,
});

export default rootReducers;
