import { Avatar, Badge, Box, Container, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import styles from "styles/common.module.css";

import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import Link from "next/link";
import MenuIcon from '@mui/icons-material/Menu';
import { CustomButton } from "src/pages/components/common";
import { useCommon } from "src/hooks/useCommon";
import moment from "moment";
import { updateTicketBaseUrl } from "src/utils/utils";
import TicketStatusComponent from "src/pages/components/ticket-status";


const statusColors = {
  open: 'green',
  in_progress: 'orange',
  close: 'red',
};

// const TicketStatusComponent = ({ params }) => {
//   const [status, setStatus] = useState(params.row.ticket_status);

//   const handleChange = (event) => {
//     setStatus(event.target.value)
//   }

//   return (
//     <div className={styles["status-booking"]} >
//       <FormControl required sx={{ m: 1, minWidth: 120, height: '50px' }}>
//         <Select
//           labelId="demo-simple-select-required-label"
//           id="demo-simple-select-required"
//           value={status}
//           onChange={handleChange}
//           style={{
//             maxHeight: '40px',
//             marginTop: "5px",
//             color: "white",
//             background: statusColors[status],
//           }}
//         >
//           <MenuItem value="open" style={{ color: statusColors.open }}>Open</MenuItem>
//           <MenuItem value="in_progress" style={{ color: statusColors.in_progress }}>In Progress</MenuItem>
//           <MenuItem value="close" style={{ color: statusColors.close }}>Close</MenuItem>
//         </Select>
//       </FormControl>
//     </div>
//   );
// };


export default function WriteByUsers() {

  const [currentPage, setCurrentPage] = useState(1);

  const common = useCommon();

  const {
    writeByUsers,
    getWriteByUsers
  } = common;

  useEffect(() => {
    getWriteByUsers();
  }, [])

  const columns = [
    { field: 'name', headerName: 'Name', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'email', headerName: 'Email', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'phone_number', headerName: 'Phone Number', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'subject', headerName: 'Subject', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'description', headerName: 'Description', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    {
      field: 'user_info',
      headerName: 'Ticket Raised By',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 200,
      renderCell: params => (
        <div >
          {params?.row?.user_info?.fullName}
        </div>
      )
    },
    {
      field: 'account_type', headerName: 'Account Type', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150, renderCell: params => (
        <div >
          {params?.row?.user_info?.account_type}
        </div>
      )
    },
    {
      field: 'user360',
      headerName: 'User 360',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 110,
      sortable: false,
      renderCell: params => {
        const uid = params?.row?.user_id?._id || params?.row?.user_id
        if (!uid) return <span>—</span>
        return (
          <Link href={`/apps/users/${uid}`} style={{ color: '#14328d' }}>
            Open
          </Link>
        )
      }
    },
    {
      field: 'ticket_status',
      headerName: 'Status',
      headerClassName: styles['header-class-last'],
      cellClassName: styles['cell-class-last'],
      width: 200,
      renderCell: params => (
        <div className={styles["status-booking"]} >
          <TicketStatusComponent params={params} base={updateTicketBaseUrl.constact_us} cb={getWriteByUsers} />
        </div>
      )
    }

  ];

  const getRowClassName = (params) => {
    return params.indexRelativeToCurrentPage % 2 === 0 ? `${styles['even-row']} ${styles['row-class']} ` : `${styles['odd-row']} ${styles['row-class']} `;
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const getRowHeight = () => 50

  return (
    <Grid container spacing={3} sx={{ width: "100%" }}>
      <Grid item xs={12} md={12} lg={12} xl={12} >
        <form noValidate autoComplete="off" >
          <Container maxWidth="xl">
            <Box sx={{ background: "white", padding: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={6} lg={6}>
                  <Typography sx={{ color: "black", fontSize: "18px", fontWeight: "600" }} >Users Feedback</Typography>
                </Grid>

                <Grid item xs={6} lg={6} sx={{ textAlign: "right" }}>
                  <CustomButton
                    component={Link}
                    variant='contained'
                    href='/apps/booking'
                    startIcon={<MenuIcon />} sx={{ backgroundColor: "#14328d", color: "white" }}>
                    Setting
                  </CustomButton>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>


                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', m: 2 }}>
                    <InputLabel sx={{ color: "black", fontSize: "14px", textAlign: "right" }}>Search
                    </InputLabel>
                    <TextField
                      size="small"
                    />
                  </Box>

                </Grid>

                <div style={{ height: "71vh", width: '100%' }}>
                  <DataGrid
                    rows={writeByUsers ?? []}
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
                    columnHeaderHeight={50}
                  />
                </div>

              </Grid>
            </Box>
          </Container>
        </form>
      </Grid>
    </Grid>
  )
}