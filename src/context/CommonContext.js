import { createContext, useState } from 'react'
import authConfig from 'src/configs/auth'
import { getApiBaseUrl } from 'src/utils/apiBase'

const defaultProvider = {
  trainerList: [],
  traineeList: [],
  bookingList: [],
  moneyRequestList: [],
  writeByUsers: [],
  concernByUsers: [],
  activeUsers: []
}
const CommonContext = createContext(defaultProvider)

const authHeaders = () => {
  const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const CommonProvider = ({ children }) => {
  const [trainerList, setTrainerList] = useState(defaultProvider.trainerList)
  const [traineeList, setTraineeList] = useState(defaultProvider.traineeList)
  const [bookingList, setBookingList] = useState(defaultProvider.bookingList)
  const [moneyRequestList, setMoneyRequestList] = useState(defaultProvider.moneyRequestList)
  const [writeByUsers, setWriteByUsers] = useState(defaultProvider.writeByUsers)
  const [concernByUsers, setConcernByUsers] = useState(defaultProvider.concernByUsers)

  const getTrainersList = async (search = '') => {
    const base = getApiBaseUrl()
    if (!base) {
      console.error('NEXT_PUBLIC_API_BASE_URL is missing; cannot load trainers.')
      setTrainerList([])
      return
    }
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token) {
      setTrainerList([])
      return
    }
    try {
      const qs = search && String(search).trim() ? `?search=${encodeURIComponent(String(search).trim())}` : ''
      const res = await fetch(`${base}/user/get-all-trainer${qs}`, { headers: authHeaders() })
      const response = await res.json().catch(() => ({}))
      setTrainerList(response?.result?.map(e => ({ ...e, id: e._id })) ?? [])
    } catch {
      setTrainerList([])
    }
  }

  const getTraineesList = async (search = '') => {
    const base = getApiBaseUrl()
    if (!base) {
      console.error('NEXT_PUBLIC_API_BASE_URL is missing; cannot load trainees.')
      setTraineeList([])
      return
    }
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token) {
      setTraineeList([])
      return
    }
    try {
      const qs = search && String(search).trim() ? `?search=${encodeURIComponent(String(search).trim())}` : ''
      const res = await fetch(`${base}/user/get-all-trainee${qs}`, { headers: authHeaders() })
      const response = await res.json().catch(() => ({}))
      setTraineeList(response?.result?.map(e => ({ ...e, id: e._id })) ?? [])
    } catch {
      setTraineeList([])
    }
  }

  const getBookingList = async () => {
    const base = getApiBaseUrl() || process.env.NEXT_PUBLIC_API_BASE_URL
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token || !base) {
      setBookingList([])
      return
    }
    try {
      const res = await fetch(`${base}/user/booking-list`, { headers: authHeaders() })
      const response = await res.json().catch(() => ({}))
      setBookingList(response?.data?.result?.map(e => ({ ...e, id: e._id })) ?? [])
    } catch {
      setBookingList([])
    }
  }

  const getWriteByUsers = async () => {
    const base = getApiBaseUrl() || process.env.NEXT_PUBLIC_API_BASE_URL
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token || !base) {
      setWriteByUsers([])
      return
    }
    try {
      const res = await fetch(`${base}/user/write-us`, { headers: authHeaders() })
      const response = await res.json().catch(() => ({}))
      setWriteByUsers(response?.result?.map(e => ({ ...e, id: e._id })) ?? [])
    } catch {
      setWriteByUsers([])
    }
  }

  const getConcernByUsers = async () => {
    const base = getApiBaseUrl() || process.env.NEXT_PUBLIC_API_BASE_URL
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token || !base) {
      setConcernByUsers([])
      return
    }
    try {
      const res = await fetch(`${base}/user/raise-concern`, { headers: authHeaders() })
      const response = await res.json().catch(() => ({}))
      setConcernByUsers(response?.result?.map(e => ({ ...e, id: e._id })) ?? [])
    } catch {
      setConcernByUsers([])
    }
  }

  const updateCommission = params => {
    const base = getApiBaseUrl() || process.env.NEXT_PUBLIC_API_BASE_URL
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!base || !storedToken) return
    fetch(`${base}/user/update-trainer-commission`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      },
      body: JSON.stringify(params)
    })
      .then(data => data.json())
      .then(() => {
        void getTrainersList()
      })
      .catch(() => {})
  }

  const getActiveUsers = async () => {
    const base = getApiBaseUrl() || process.env.NEXT_PUBLIC_API_BASE_URL
    const response = await fetch(`${base}/connected-users`, { headers: authHeaders() })
    return response.json()
  }

  const values = {
    trainerList,
    setTrainerList,
    traineeList,
    setTraineeList,
    getTrainersList,
    getTraineesList,
    updateCommission,
    bookingList,
    setBookingList,
    moneyRequestList,
    setMoneyRequestList,
    getBookingList,
    writeByUsers,
    concernByUsers,
    getWriteByUsers,
    getConcernByUsers,
    getActiveUsers
  }

  return <CommonContext.Provider value={values}>{children}</CommonContext.Provider>
}

export { CommonContext, CommonProvider }
