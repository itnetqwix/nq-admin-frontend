import { useContext } from 'react'
import { CommonContext } from 'src/context/CommonContext'

export const useCommon = () => useContext(CommonContext)
