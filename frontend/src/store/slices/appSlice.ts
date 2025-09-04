import { createSlice } from '@reduxjs/toolkit'

interface AppState {
  // Add your app state properties here
}

const initialState: AppState = {
  // Add your initial state values here
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Add your reducers here
  },
})

export const {} = appSlice.actions
export default appSlice.reducer
