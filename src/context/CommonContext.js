import { createContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import authConfig from 'src/configs/auth'
import { useAuth } from 'src/hooks/useAuth'
import { getApiBaseUrl } from 'src/utils/apiBase'
// import { useAuth } from 'src/hooks/useAuth'

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

const CommonProvider = ({ children }) => {

  // ** Hooks
  const router = useRouter()
  const auth = useAuth()

  const {
    user,
    loading,
    setUser,
    setLoading,
  } = auth;

  // ** States
  const [trainerList, setTrainerList] = useState(defaultProvider.trainerList)
  const [traineeList, setTraineeList] = useState(defaultProvider.traineeList);
  const [bookingList, setBookingList] = useState(defaultProvider.bookingList);
  const [moneyRequestList, setMoneyRequestList] = useState(defaultProvider.moneyRequestList);
  const [writeByUsers, setWriteByUsers] = useState(defaultProvider.writeByUsers);
  const [concernByUsers, setConcernByUsers] = useState(defaultProvider.concernByUsers);
  const [activeUsers, setActiveUsers] = useState(defaultProvider.activeUsers);

  useEffect(() => {
    // getTrainersList()
    // getTraineesList()
    // getBookingList()
    // getWriteByUsers()
    // getConcernByUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id])

  const getTrainersList = async (search = '') => {
    const base = getApiBaseUrl()
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!base) {
      console.error('NEXT_PUBLIC_API_BASE_URL is missing; cannot load trainers.')
      setTrainerList([])
      return
    }
    if (storedToken) {
      // setLoading(true);
      const qs = search && String(search).trim() ? `?search=${encodeURIComponent(String(search).trim())}` : ''
      await fetch(`${base}/user/get-all-trainer${qs}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(data => {
          setLoading(false)
          return data.json();
        })
        .then(async response => {
          setLoading(false)
          setTrainerList(response?.result?.map(e => ({ ...e, id: e._id })) ?? [])
        })
        .catch(() => {
          setTrainerList([])
          setLoading(false)
        }).finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }

  const getTraineesList = async (search = '') => {
    const base = getApiBaseUrl()
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!base) {
      console.error('NEXT_PUBLIC_API_BASE_URL is missing; cannot load trainees.')
      setTraineeList([])
      return
    }
    if (storedToken) {
      // setLoading(true)
      const qs = search && String(search).trim() ? `?search=${encodeURIComponent(String(search).trim())}` : ''
      await fetch(`${base}/user/get-all-trainee${qs}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(data => {
          setLoading(false)
          return data.json();
        })
        .then(async response => {
          setLoading(false)
          setTraineeList(response?.result?.map(e => ({ ...e, id: e._id })) ?? [])
        })
        .catch(() => {
          setTraineeList([])
          setLoading(false)
        }).finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }

  const getBookingList = async () => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (storedToken) {
      // setLoading(true)
      await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/user/booking-list', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(data => {
          return data.json();
        })
        .then(async response => {
          // setLoading(false)
          setBookingList(response?.data?.result?.map(e => ({ ...e, id: e._id })) ?? [])
        })
        .catch(() => {
          setBookingList([])
          // setLoading(false)
        })
    } else {
      // setLoading(false)
    }
  }

  const getWriteByUsers = async () => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (storedToken) {
      // setLoading(true)
      await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/user/write-us', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(data => {
          return data.json();
        })
        .then(async response => {
          // setLoading(false)
          setWriteByUsers(response?.result?.map(e => ({ ...e, id: e._id })) ?? [])
        })
        .catch(() => {
          setWriteByUsers([])
          // setLoading(false)
        })
    } else {
      // setLoading(false)
    }
  }

  const getConcernByUsers = async () => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (storedToken) {
      // setLoading(true)
      await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/user/raise-concern', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(data => {
          return data.json();
        })
        .then(async response => {
          // setLoading(false)
          setConcernByUsers(response?.result?.map(e => ({ ...e, id: e._id })) ?? [])
        })
        .catch(() => {
          setConcernByUsers([])
          // setLoading(false)
        })
    } else {
      // setLoading(false)
    }
  }

  const updateCommission = (params) => {
    setLoading(true)
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
      },
      body: JSON.stringify(params),
    };
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/user/update-trainer-commission', options)
      .then(data => {
        return data.json();
      }).then(response => {
        getTrainersList();
      }).catch(e => {
        setLoading(false)
      });

  }

  const getActiveUsers = async () => {
    console.log('get active users triggered');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/connected-users`);
      const data = await response.json();
      return data;  // Return the data after successful fetch
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw error;  // Re-throw the error for external error handling if necessary
    }
  };
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
