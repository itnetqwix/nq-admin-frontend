import { Avatar, Badge, Box, IconButton } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import Link from 'next/link'
import MenuIcon from '@mui/icons-material/Menu'

import {
  AdminDataGrid,
  AdminFilterBar,
  AdminGridContainer,
  useAdminConfirm
} from 'src/components/admin'
import { CustomButton } from 'src/pages/components/common'
import { useCommon } from 'src/hooks/useCommon'
import { getImageUrl } from 'src/utils/utils'
import TraineeRejectActions from 'src/pages/components/trainee-reject/TraineeRejectActions'
import toast from 'react-hot-toast'
import UserQuickPreviewModal from 'src/components/user360/UserQuickPreviewModal'
import { getUser360 } from 'src/services/user360Api'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import authConfig from 'src/configs/auth'

export default function ManageTrainee() {
  const router = useRouter()
  const searchTimerRef = useRef(null)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const common = useCommon()
  const { traineeList, getTraineesList } = common

  useEffect(() => {
    getTraineesList()
  }, [])

  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false)
  const [selectedStudentData, setSelectedStudentData] = useState({})
  const [isQuickPreviewLoading, setIsQuickPreviewLoading] = useState(false)
  const [previewUserId, setPreviewUserId] = useState(null)
  const [tableData, setTableData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (traineeList) setTableData(traineeList)
  }, [traineeList])

  function scheduleTraineeSearch(searchValue) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      getTraineesList(searchValue || '')
    }, 400)
  }

  const requestDelete = async id => {
    const ok = await confirm({
      title: 'Delete trainee account?',
      message: 'This permanently removes the user and cannot be undone.',
      detail: `User ID: ${id}`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return

    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!storedToken) {
      toast.error('Session expired. Please login again.')
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/delete-user/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${storedToken}` }
      })
      const responseData = await response.json()
      if (!response.ok || responseData?.status === 'fail') {
        throw new Error(responseData?.error || 'Unable to delete user.')
      }
      setTableData(prev => prev.filter(item => item?.id !== id))
      toast.success('User deleted successfully.')
    } catch (error) {
      toast.error(error?.message || 'Unable to delete user.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCourseClick = async id => {
    if (id == null || id === 'undefined') return
    setPreviewUserId(String(id))
    setIsQuickPreviewOpen(true)
    setIsQuickPreviewLoading(true)
    try {
      const data = await getUser360(id)
      setSelectedStudentData(data || {})
    } catch (error) {
      toast.error(error?.message || 'Unable to load user preview')
      setSelectedStudentData({})
    } finally {
      setIsQuickPreviewLoading(false)
    }
  }

  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      width: 120,
      renderCell: params => (
        <Badge overlap='circular' sx={{ ml: 2 }}>
          <Avatar
            alt={params?.row?.fullname || 'Trainee'}
            sx={{ width: 64, height: 64 }}
            src={
              getImageUrl(params?.row?.profile_picture) ??
              'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'
            }
          />
        </Badge>
      )
    },
    { field: 'fullname', headerName: 'Trainee Name', width: 160 },
    { field: 'email', headerName: 'Email', width: 190 },
    { field: 'mobile_no', headerName: 'Mobile', width: 130 },
    {
      field: 'status',
      headerName: 'Status',
      width: 180,
      renderCell: params => (
        <TraineeRejectActions
          userId={params.row.id || params.row._id}
          status={params.row.status}
          onUpdated={() => getTraineesList()}
        />
      )
    },
    { field: 'category', headerName: 'Category', width: 100 },
    {
      field: 'wallet_amount',
      headerName: 'Wallet',
      width: 110,
      valueGetter: p =>
        p.row.wallet_amount != null ? `$${Number(p.row.wallet_amount).toFixed(2)}` : '—'
    },
    { field: 'login_type', headerName: 'Login', width: 100 },
    {
      field: 'referral_code',
      headerName: 'Referral',
      width: 110,
      valueGetter: p => p.row.referral_code || '—'
    },
    {
      field: 'referred_by_user_id',
      headerName: 'Referred by',
      width: 120,
      valueGetter: p => p.row.referred_by_user_id || '—'
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 150,
      valueGetter: p => (p.row.createdAt ? new Date(p.row.createdAt).toLocaleDateString() : '—')
    },
    {
      field: 'view',
      headerName: 'Preview',
      width: 80,
      sortable: false,
      renderCell: params => (
        <IconButton onClick={() => handleCourseClick(params.row.id)} aria-label='Preview' size='small'>
          <VisibilityIcon fontSize='small' />
        </IconButton>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: params => (
        <IconButton
          onClick={e => {
            e.stopPropagation()
            void requestDelete(params.row.id)
          }}
          aria-label='Delete'
          color='error'
          size='small'
          disabled={isDeleting}
        >
          <DeleteOutlineIcon fontSize='small' />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <UserQuickPreviewModal
        open={isQuickPreviewOpen}
        handleClose={() => {
          setIsQuickPreviewOpen(false)
          setPreviewUserId(null)
        }}
        loading={isQuickPreviewLoading}
        user360Data={selectedStudentData}
        userId={previewUserId || selectedStudentData?.user?._id || selectedStudentData?.user?.id}
      />
      <form noValidate autoComplete='off'>
        <AdminPageShell
          title='Trainees'
          subtitle='Directory with wallet, referral, join date, and status — click a row for User 360.'
          actions={
            <CustomButton component={Link} variant='contained' href='/apps/manage-trainer' startIcon={<MenuIcon />}>
              Trainers
            </CustomButton>
          }
          contentSx={{ p: 0 }}
        >
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Name or email…'
              searchValue={searchText}
              onSearchChange={e => {
                setSearchText(e.target.value)
                scheduleTraineeSearch(e.target.value)
              }}
              resultCount={tableData?.length}
              helperText='Click a row to open the full user profile.'
            />
            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                onRowClick={params => {
                  const rid = params?.row?.id || params?.row?._id
                  if (rid) router.push(`/apps/users/${rid}`)
                }}
                rows={tableData ?? []}
                columns={columns}
                getRowHeight={() => 88}
                columnHeaderHeight={56}
                clickableRows
              />
            </AdminGridContainer>
          </AdminPageSection>
        </AdminPageShell>
      </form>
      {ConfirmDialog}
    </>
  )
}
