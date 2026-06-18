import React, { createContext, useContext } from 'react'

import { getDeviceFrame } from './contentPlacementConfig'

const MobilePreviewFrameContext = createContext(getDeviceFrame('standard'))

export function MobilePreviewFrameProvider({ frame, children }) {
  return <MobilePreviewFrameContext.Provider value={frame}>{children}</MobilePreviewFrameContext.Provider>
}

/** Current preview device geometry (falls back to standard when outside a frame). */
export function useMobilePreviewFrame() {
  return useContext(MobilePreviewFrameContext)
}
