import { Avatar, Badge, Box, IconButton } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SaveAsIcon from '@mui/icons-material/SaveAs'
import Link from 'next/link'
import MenuIcon from '@mui/icons-material/Menu'

import {
  AdminDataGrid,
  AdminFilterBar,
  AdminGridContainer,
  useAdminConfirm
} from 'src/components/admin'
import { CustomButton } from 'src/pages/components/common'
import MModal from 'src/pages/components/modal/Modal'
import AddEditCommision from 'src/pages/components/add-edit-commision'
import { useCommon } from 'src/hooks/useCommon'
import authConfig from 'src/configs/auth'
import { getImageUrl } from 'src/utils/utils'
import TrainerStatus from 'src/pages/components/trainer-status'
import toast from 'react-hot-toast'
import UserQuickPreviewModal from 'src/components/user360/UserQuickPreviewModal'
import { getUser360 } from 'src/services/user360Api'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { formatOpsDateTime } from 'src/utils/opsDateTime'

export default function ManageTrainer() {
  const router = useRouter()
  const searchTimerRef = useRef(null)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const common = useCommon()
  const { trainerList, setTrainerList, getTrainersList } = common

  useEffect(() => {
    getTrainersList()
  }, [])

  const [openCommisionModal, setOpenCommisionModal] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false)
  const [selectedStudentData, setSelectedStudentData] = useState({})
  const [isQuickPreviewLoading, setIsQuickPreviewLoading] = useState(false)
  const [previewUserId, setPreviewUserId] = useState(null)

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

  const requestDelete = async id => {
    const ok = await confirm({
      title: 'Delete trainer account?',
      message: 'This permanently removes the user and cannot be undone.',
      detail: `User ID: ${id}`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    await onConformDelete(id)
  }

  const onConformDelete = async id => {
    if (!id || isDeleting) return

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
      setTrainerList(prev => prev.filter(item => item?.id !== id))
      toast.success('User deleted successfully.')
    } catch (error) {
      toast.error(error?.message || 'Unable to delete user.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenCommisionModal = id => {
    setOpenCommisionModal(true)
    setSelectedId(id)
  }

  const handleCloseCommisionModal = () => {
    setOpenCommisionModal(false)
    setSelectedId(null)
  }

  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      width: 120,
      renderCell: params => (
        <Badge overlap='circular' sx={{ ml: 2 }}>
          <Avatar
            alt={params?.row?.fullname || 'Trainer'}
            sx={{ width: 64, height: 64 }}
            src={
              getImageUrl(params?.row?.profile_picture) ??
              'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'
            }
          />
        </Badge>
      )
    },
    { field: 'fullname', headerName: 'Trainer Name', width: 160 },
    { field: 'email', headerName: 'Email', width: 190 },
    { field: 'mobile_no', headerName: 'Mobile', width: 130 },
    {
      field: 'status',
      headerName: 'Status',
      width: 180,
      renderCell: params => <TrainerStatus params={params} />
    },
    { field: 'category', headerName: 'Category', width: 100 },
    {
      field: 'wallet_amount',
      headerName: 'Wallet',
      width: 110,
      valueGetter: p =>
        p.row.wallet_amount != null ? `$${Number(p.row.wallet_amount).toFixed(2)}` : '—'
    },
    {
      field: 'commission',
      headerName: 'Commission',
      width: 130,
      renderCell: params => (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span>{params.row.commission ?? 0}%</span>
          <IconButton onClick={() => handleOpenCommisionModal(params.row.id)} aria-label='Edit commission' size='small'>
            <SaveAsIcon fontSize='small' />
          </IconButton>
        </Box>
      )
    },
    { field: 'login_type', headerName: 'Login', width: 100 },
    {
      field: 'is_kyc_completed',
      headerName: 'KYC',
      width: 80,
      valueGetter: p => (p.row.is_kyc_completed ? 'Yes' : 'No')
    },
    {
      field: 'is_registered_with_stript',
      headerName: 'Stripe',
      width: 90,
      valueGetter: p => (p.row.is_registered_with_stript ? 'Onboarded' : '—')
    },
    {
      field: 'referral_code',
      headerName: 'Referral',
      width: 110,
      valueGetter: p => p.row.referral_code || '—'
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 170,
      valueGetter: p => (p.row.createdAt ? formatOpsDateTime(p.row.createdAt, { withSeconds: false }) : '—')
    },
    {
      field: 'view',
      headerName: 'Preview',
      width: 80,
      sortable: false,
      renderCell: params => (
        <IconButton onClick={() => handleCourseClick(params.row.id)} aria-label='Quick preview'>
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

  const [tableData, setTableData] = useState([])
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (trainerList) setTableData(trainerList)
  }, [trainerList])

  function scheduleTrainerSearch(searchValue) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      getTrainersList(searchValue || '')
    }, 400)
  }

  return (
    <React.Fragment>
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
          icon='mdi:human-male-board'
          title='Trainers'
          subtitle='Directory with KYC, Stripe, wallet, commission, and referral — click a row for User 360.'
          actions={
            <>
              <CustomButton component={Link} variant='outlined' href='/apps/users'>
                All users
              </CustomButton>
              <CustomButton component={Link} variant='outlined' href='/apps/trainer-verifications'>
                Verifications queue
              </CustomButton>
              <CustomButton component={Link} variant='contained' href='/apps/manage-trainer' startIcon={<MenuIcon />}>
                Directory
              </CustomButton>
            </>
          }
          contentSx={{ p: 0 }}
        >
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Name or email…'
              searchValue={searchText}
              onSearchChange={e => {
                setSearchText(e.target.value)
                scheduleTrainerSearch(e.target.value)
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

      <MModal handleClose={handleCloseCommisionModal} open={openCommisionModal} maxWidth='xs'>
        <AddEditCommision handleClose={handleCloseCommisionModal} trainer_id={selectedId} />
      </MModal>

      {ConfirmDialog}
    </React.Fragment>
  )
}
