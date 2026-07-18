import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    commandPaletteOpen: false,
    mobileNavOpen: false,
    /** Soft page accent hint for shell chrome */
    pageAccent: 'default',
    /** Last global notice for debugging / toast bridges */
    notice: null
  },
  reducers: {
    setCommandPaletteOpen(state, action) {
      state.commandPaletteOpen = Boolean(action.payload)
    },
    toggleCommandPalette(state) {
      state.commandPaletteOpen = !state.commandPaletteOpen
    },
    setMobileNavOpen(state, action) {
      state.mobileNavOpen = Boolean(action.payload)
    },
    setPageAccent(state, action) {
      state.pageAccent = action.payload || 'default'
    },
    setNotice(state, action) {
      state.notice = action.payload
        ? { message: String(action.payload.message || action.payload), tone: action.payload.tone || 'info', at: Date.now() }
        : null
    },
    clearNotice(state) {
      state.notice = null
    }
  }
})

export const {
  setCommandPaletteOpen,
  toggleCommandPalette,
  setMobileNavOpen,
  setPageAccent,
  setNotice,
  clearNotice
} = uiSlice.actions

export const selectUi = state => state.ui
export const selectCommandPaletteOpen = state => state.ui.commandPaletteOpen

export default uiSlice.reducer
