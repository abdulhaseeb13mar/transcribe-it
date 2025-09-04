import { configureStore } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'
import appReducer from './slices/appSlice'
import authReducer from './slices/authSlice'
import {
  useSelector as useAppSelector,
  type TypedUseSelectorHook,
} from 'react-redux'

// Auth persist config - exclude error and isLoading
const authPersistConfig = {
  key: 'auth',
  storage,
  blacklist: ['error', 'isLoading'],
}

// Create persisted auth reducer
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)

// Combine with persisted auth reducer
const persistedRootReducer = combineReducers({
  app: appReducer,
  auth: persistedAuthReducer,
})

const store = configureStore({
  reducer: persistedRootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

const { dispatch } = store

// const useDispatch = () => useAppDispatch<AppDispatch>()
const useSelector: TypedUseSelectorHook<RootState> = useAppSelector

export { store, dispatch, useSelector }
