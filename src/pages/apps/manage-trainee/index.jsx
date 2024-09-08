import { Autocomplete, Avatar, Badge, Box, Button, CircularProgress, Container, Divider, FormControl, FormControlLabel, FormHelperText, Grid, IconButton, InputLabel, MenuItem, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';

import styles from "styles/common.module.css";

import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import Link from "next/link";
import MenuIcon from '@mui/icons-material/Menu';
import { CustomButton } from "src/pages/components/common";
import { useCommon } from "src/hooks/useCommon";
import Modal from "src/pages/components/modal/Modal";
import authConfig from 'src/configs/auth'
import StudentDetail from "src/layouts/components/student/StudentDetail";
import { debouncedSearchMedicine } from "src/utils/utils";
import ReactStrapModal from "src/pages/components/modal/ReactStrapModal";
import { X } from "react-feather";


{/* <MenuItem value="xs">xs</MenuItem>
<MenuItem value="sm">sm</MenuItem>
<MenuItem value="md">md</MenuItem>
<MenuItem value="lg">lg</MenuItem>
<MenuItem value="xl">xl</MenuItem> */}


export default function ManageTrainee() {

  const common = useCommon();

  const {
    traineeList,
    getTraineesList
  } = common;

  useEffect(() => {
    getTraineesList();
  }, [])

  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStudentData, SetselectedStudentData] = useState({})
  const [recentStudentClips, setRecentStudentClips] = useState([]);


  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (traineeList) {
      setTableData(traineeList)
    }
  }, [traineeList])

  async function getSearchValue(searchText) {
    const searchResults = await debouncedSearchMedicine(searchText, traineeList, "fullname")
    setTableData(searchResults)
  }

  const dynamicImageURL = (url) => {
    let updatedURL = url?.toString()?.split("public")[1]
    if (updatedURL === undefined) {
      return url
    }
    updatedURL = process?.env?.NEXT_PUBLIC_API_BASE_URL + "/public" + url?.toString()?.split("public")[1]
    return updatedURL
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
            src={dynamicImageURL(params?.row?.profile_picture) ?? 'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'}
          // src='https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'
          />
        </Badge>
      )
    },
    { field: 'fullname', headerName: 'Trainer Name', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 180 },
    { field: 'email', headerName: 'Trainer Email', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'mobile_no', headerName: 'Mobile Number', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
    { field: 'category', headerName: 'Category', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 100 },
    { field: 'wallet_amount', headerName: 'Wallet Amount', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
    { field: 'login_type', headerName: 'Login Type', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
    {
      field: 'view',
      headerName: 'Trainee Clips',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 150,
      renderCell: params => (
        <div >
          <IconButton
            onClick={() => {
              handleCourseClick(params.row.id)
              SetselectedStudentData(params.row)
            }}
            aria-label='Edit'>
            <VisibilityIcon className={styles['view-icon']} />
          </IconButton>
        </div>
      )
    },
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
            // onClick={() => handleOpen(params.row.id)}
            aria-label='Delete'>
            <DeleteOutlineIcon className={styles['delete-icon']} />
          </IconButton>
        </div>
      )
    }

  ];


  const getTraineeClips = async (params) => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
      },
      body: JSON.stringify(params),
    };
    return fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/trainer/get-trainee-clips', options)
      .then(data => data.json()).then(res => res.data).catch(e => e);

  }

  const getTraineeClipsApi = async (id) => {
    try {
      let res = await getTraineeClips({ trainer_id: id })
      setRecentStudentClips(res)
    } catch (error) {
      console.log(error)
    }
  }

  const handleCourseClick = (id) => {
    setIsOpen(true)
    getTraineeClipsApi(id)
  };

  const getRowClassName = (params) => {
    return params.indexRelativeToCurrentPage % 2 === 0 ? `${styles['even-row']} ${styles['row-class']} ` : `${styles['odd-row']} ${styles['row-class']} `;
  };

  const getRowHeight = () => 100

  return (
    <>
      <Grid container spacing={3} sx={{ width: "100%" }}>
        <Grid item xs={12} md={12} lg={12} xl={12} >
          <form noValidate autoComplete="off" >
            <Container maxWidth="xl">
              <Box sx={{ background: "white", padding: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={6} lg={6}>
                    <Typography sx={{ color: "black", fontSize: "18px", fontWeight: "600" }} >Trainee User List</Typography>
                  </Grid>

                  <Grid item xs={6} lg={6} sx={{ textAlign: "right" }}>
                    <CustomButton
                      component={Link}
                      variant='contained'
                      href='/apps/manage-trainer'
                      startIcon={<MenuIcon />} sx={{ backgroundColor: "#14328d", color: "white" }}>
                      Setting
                    </CustomButton>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider

                    // sx={{ my: 2 }}
                    />
                  </Grid>

                  <Grid item xs={12}>


                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', m: 2 }}>
                      <InputLabel sx={{ color: "black", fontSize: "14px", textAlign: "right" }}>Search
                      </InputLabel>
                      <TextField
                        size="small"
                        onChange={(e) => getSearchValue(e.target.value)}
                      // sx={{ borderRadius: "0px", border: "none" }}
                      />
                    </Box>

                  </Grid>

                  <div style={{ height: "71vh", width: '100%' }}>
                    <DataGrid
                      // rows={rows}
                      // columns={columns}
                      // headerClassName={styles['header-class']}
                      // getRowClassName={getRowClassName}
                      // initialState={{
                      //   pagination: {
                      //     paginationModel: { page: 0, pageSize: 25 },
                      //   },
                      // }}
                      // pageSizeOptions={[25, 50]}
                      // getRowHeight={getRowHeight}
                      //   columnHeaderHeight={40}

                      // className="datagrid"
                      // loading={isLoading}
                      // columnVisibilityModel={{
                      //   id: false
                      // }}
                      // rows={rows}
                      // columns={columns}
                      // headerClassName={styles['header-class']}
                      // getRowClassName={getRowClassName}
                      // pageSize={25}
                      // // onSelectionModelChange={onSelectionChange}
                      // disableSelectionOnClick
                      // components={{
                      //   Pagination: CustomPagination,
                      //   NoRowsOverlay: CustomNoRowsOverlay
                      // }}
                      // getRowHeight={getRowHeight}
                      // columnHeaderHeight={40}

                      // onRowClick={handleOpenMDP}

                      rows={tableData ?? []}
                      columns={columns}
                      headerClassName={styles['header-class']}
                      getRowClassName={getRowClassName}
                      initialState={{
                        pagination: {
                          paginationModel: { page: 0, pageSize: 25 },
                        },
                      }}
                      pageSizeOptions={[25, 50]}
                      getRowHeight={getRowHeight}
                      columnHeaderHeight={80}
                    />
                  </div>

                </Grid>
              </Box>
            </Container>
          </form>
        </Grid>
      </Grid>

      {/* ******************************************* */}

      {/* <Modal handleClose={() => setIsOpen(false)} open={isOpen} maxWidth="xl">
        <StudentDetail data={selectedStudentData} recentStudentClips={recentStudentClips} />
      </Modal> */}

      <ReactStrapModal
        isOpen={isOpen}
        element={
          <div className="container media-gallery portfolio-section grid-portfolio ">
            <div className="theme-title">
              <div className="media">
                <div className="media-body media-body text-right">
                  <div className="icon-btn btn-sm btn-outline-light close-apps pointer" onClick={() => { setIsOpen(false) }} > <X /> </div>
                </div>
              </div>
              <StudentDetail data={selectedStudentData} recentStudentClips={recentStudentClips} />
            </div>
          </div>
        }
      />
    </>
  )
}


