import { createContext, useContext } from 'react'

const noop = () => {}

/** { current: {type,id}|null, open(type,id), close(), hrefFor(type,id) } */
export const EntityDrawerContext = createContext({
  current: null,
  open: noop,
  close: noop,
  hrefFor: () => '#'
})

export const useEntityDrawer = () => useContext(EntityDrawerContext)
