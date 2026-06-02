import { Autocomplete, Avatar, Badge, Box, Button, CircularProgress, FormControl, FormControlLabel, FormHelperText, Grid, IconButton, InputLabel, MenuItem, Radio, RadioGroup, TextField, Typography, useMediaQuery } from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';

import styles from "styles/common.module.css";

import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import Link from "next/link";
import MenuIcon from '@mui/icons-material/Menu';
import { CustomButton } from "src/pages/components/common";
import DeletePopup from "src/pages/components/modal/DeletePopup";
import MModal from "src/pages/components/modal/Modal";
import AddEditCommision from "src/pages/components/add-edit-commision";
import { useAuth } from "src/hooks/useAuth";
import { useCommon } from "src/hooks/useCommon";
import authConfig from 'src/configs/auth'
import { getImageUrl } from "src/utils/utils";
import TicketStatusComponent from "src/pages/components/ticket-status";
import TrainerStatus from "src/pages/components/trainer-status";
import toast from "react-hot-toast";
import UserQuickPreviewModal from "src/pages/components/user360/UserQuickPreviewModal";
import { getUser360 } from "src/services/user360Api";
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell';

function CustomPagination() {

  const handlePageChange = (event, newPage) => {

    if (newPage !== currentPage) {

      setCurrentPage(newPage)
    }

  }

  return (
    <Stack>
      <Pagination
        count={Math.ceil(count / limit)}
        page={currentPage}
        onChange={handlePageChange}
        shape='rounded'
        sx={{
          '& button.Mui-selected': {
            backgroundColor: 'green', // Change this color to the desired green color
            color: 'white',
            '&:hover': {
              backgroundColor: 'darkgreen', // Change this color for hover effect
            },
          },
        }}
      />
    </Stack>
  );
}

export default function ManageTrainer() {
  const router = useRouter();
  const searchTimerRef = useRef(null);

  const auth = useAuth();
  const common = useCommon();

  const {
    trainerList,
    setTrainerList,
    traineeList,
    setTraineeList,
    getTrainersList,
  } = common;


  // console.log(common)
  useEffect(() => {
    getTrainersList();
  }, [])

  const [currentPage, setCurrentPage] = useState(1);
  const [openDeletePopup, setOpenDeletePopup] = useState(false);
  const [openCommisionModal, setOpenCommisionModal] = useState(false);
  const [SelectedId, setSelectedId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState(false)
  const [selectedStudentData, setSelectedStudentData] = useState({})
  const [isQuickPreviewLoading, setIsQuickPreviewLoading] = useState(false)
  const [previewUserId, setPreviewUserId] = useState(null)

  const handleCourseClick = async (id) => {
    if (id == null || id === "undefined") return
    setPreviewUserId(String(id))
    setIsQuickPreviewOpen(true)
    setIsQuickPreviewLoading(true)
    try {
      const data = await getUser360(id)
      setSelectedStudentData(data || {})
    } catch (error) {
      toast.error(error?.message || "Unable to load user preview")
      setSelectedStudentData({})
    } finally {
      setIsQuickPreviewLoading(false)
    }
  };

  const getRowClassName = (params) => {
    return params.indexRelativeToCurrentPage % 2 === 0 ? `${styles['even-row']} ${styles['row-class']} ` : `${styles['odd-row']} ${styles['row-class']} `;
  };

  const getRowHeight = () => 100;

  const handleOpen = (id) => {
    setOpenDeletePopup(true);
    setSelectedId(id)
  }

  const handleCloseDeletePopup = () => {
    setOpenDeletePopup(false);
    setSelectedId(null)
  }

  const onConformDelete = async () => {
    if (!SelectedId || isDeleting) return;

    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName);
    if (!storedToken) {
      toast.error("Session expired. Please login again.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/delete-user/${SelectedId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      const responseData = await response.json();
      if (!response.ok || responseData?.status === "fail") {
        throw new Error(responseData?.error || "Unable to delete user.");
      }

      setTableData((prev) => prev.filter((item) => item?.id !== SelectedId));
      setTrainerList((prev) => prev.filter((item) => item?.id !== SelectedId));
      toast.success("User deleted successfully.");
      handleCloseDeletePopup();
    } catch (error) {
      toast.error(error?.message || "Unable to delete user.");
    } finally {
      setIsDeleting(false);
    }
  }

  const handleOpenCommisionModal = (id) => {
    setOpenCommisionModal(true);
    setSelectedId(id)
  }

  const handleCloseCommisionModal = () => {
    setOpenCommisionModal(false);
    setSelectedId(null)
  }

  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 120,
      renderCell: params => (
        <Badge
          overlap='circular'
          sx={{ ml: 2, cursor: 'pointer' }}
        // anchorOrigin={{
        //   vertical: 'bottom',
        //   horizontal: 'right'
        // }}
        >
          <Avatar
            alt='Alam'
            sx={{ width: 80, height: 80 }}
            src={getImageUrl(params?.row?.profile_picture) ?? 'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'}
          />
        </Badge>
      )
    },
    { field: 'fullname', headerName: 'Trainer Name', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 180 },
    { field: 'email', headerName: 'Trainer Email', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'mobile_no', headerName: 'Mobile Number', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 200,
      renderCell: params => (
        <div className={styles["status-booking"]} >
          <TrainerStatus params={params} />
        </div>
      )
    }, { field: 'category', headerName: 'Category', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 100 },
    { field: 'wallet_amount', headerName: 'Wallet Amount', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
    {
      field: 'view',
      headerName: 'Trainer Clips',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 150,
      renderCell: params => (
        <div>
          <IconButton
            onClick={() => {
              handleCourseClick(params.row.id)
            }}
            aria-label='Edit'>
            <VisibilityIcon className={styles['view-icon']} />
          </IconButton>
        </div>
      )
    },
    {
      field: 'commission',
      headerName: 'Commission',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 150,
      renderCell: params => {
        // console.log(params.row)
        return (
          <div style={{ display: "flex", justifyContent: "space-between", width: "-webkit-fill-available", alignItems: "center" }}>
            <label>{params.row.commission}%</label>
            <IconButton
              onClick={() => handleOpenCommisionModal(params.row.id)}
              aria-label='Edit'>
              <SaveAsIcon className={styles['edit-icon']} />
            </IconButton>
          </div>
        )
      }
    },
    { field: 'login_type', headerName: 'Login Type', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      headerClassName: styles['header-class-last'],
      cellClassName: styles['cell-class-last'],
      width: 100,
      renderCell: params => (
        <div>
          <IconButton
            // onClick={() => handleEdit(params.row.id)}
            aria-label='Edit'>
            <SaveAsIcon className={styles['edit-icon']} />
          </IconButton>

          <IconButton
            onClick={() => handleOpen(params.row.id)}
            aria-label='Delete'>
            <DeleteOutlineIcon className={styles['delete-icon']} />
          </IconButton>
        </div>
      )
    }

  ];

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (trainerList) {
      setTableData(trainerList)
    }
  }, [trainerList])

  function scheduleTrainerSearch(searchText) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      getTrainersList(searchText || "")
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
          title='Trainers'
          subtitle='Search the directory and click a row to open User 360.'
          actions={
            <>
              <CustomButton component={Link} variant='outlined' href='/apps/trainer-verifications'>
                Verifications queue
              </CustomButton>
              <CustomButton component={Link} variant='contained' href='/apps/manage-trainer' startIcon={<MenuIcon />}>
                Settings
              </CustomButton>
            </>
          }
          contentSx={{ p: 0 }}
        >
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Name or email…'
              onSearchChange={e => scheduleTrainerSearch(e.target.value)}
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
                getRowClassName={getRowClassName}
                getRowHeight={getRowHeight}
                columnHeaderHeight={80}
              />
            </AdminGridContainer>
          </AdminPageSection>
        </AdminPageShell>
      </form>

      <DeletePopup
        handleClose={handleCloseDeletePopup}
        open={openDeletePopup}
        onConform={onConformDelete}
        isLoading={isDeleting}
      />

      <MModal handleClose={handleCloseCommisionModal} open={openCommisionModal} maxWidth="xs">
        <AddEditCommision handleClose={handleCloseCommisionModal} trainer_id={SelectedId} />
      </MModal>

      {/* ******************************************* */}


    </React.Fragment>
  )
}


