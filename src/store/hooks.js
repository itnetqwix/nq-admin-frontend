import { useDispatch, useSelector } from 'react-redux'

/** @returns {import('@reduxjs/toolkit').Dispatch} */
export const useAppDispatch = () => useDispatch()

/** @template T @param {(state: import('./index').store extends { getState: () => infer S } ? S : any) => T} selector */
export const useAppSelector = selector => useSelector(selector)
