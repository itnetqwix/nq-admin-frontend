import { Avatar, Badge, Box, Container, Divider, Grid, IconButton, InputLabel, TextField, Typography } from "@mui/material";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { AbilityContext } from 'src/layouts/components/acl/Can'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import styles from "styles/common.module.css";

import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import Link from "next/link";
import MenuIcon from '@mui/icons-material/Menu';
import { CustomButton } from "src/pages/components/common";
import { useCommon } from "src/hooks/useCommon";
import moment from "moment";
import RefundPopups from "src/pages/components/modal/RefundPopups";
import toast from "react-hot-toast";
import authConfig from 'src/configs/auth'
import { BookedSession, debouncedSearchMedicine, isCurrentDateBefore } from "src/utils/utils";
import CancelSessionPopups from "src/pages/components/modal/CancelSessionPopups";

const booking_status = {
  canceled: "red",
  booked: "blue",
  confirmed: "green",
  completed: "orange"
};

export default function Booking() {
  const ability = useContext(AbilityContext)
  const canRefund = ability?.can('update', 'admin-action-refund') ?? true

  const [currentPage, setCurrentPage] = useState(1);
  const [openRefundPopup, setOpenRefundPopup] = useState(false);
  const [paymentIntentDetails, setPaymentIntentDetails] = useState({});
  const [bookingId, setBookingId] = useState(null);
  const [refundRow, setRefundRow] = useState(null);
  const [openClosePopup, setOpenClosePopup] = useState(false);
  const [cancelId, setCancelId] = useState(null);

  const common = useCommon();

  const {
    bookingList,
    getBookingList
  } = common;

  useEffect(() => {
    getBookingList();
  }, [])

  const showRefundPopup = (row) => {
    if (!row?.payment_intent_id || !canRefund) return
    setRefundRow(row)
    setOpenRefundPopup(true);
    setBookingId(row._id)
    getPaymentIntentDetails({ payment_intent_id: row.payment_intent_id })
  }

  const columns = [
    { field: '_id', headerName: 'Booking Id', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 250 },
    {
      field: 'booked_date',
      headerName: 'Booking Date',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 150,
      renderCell: params => (
        <div>
          {moment(params.row.booked_date).format('MM-DD-YY')}
        </div>
      )

    },
    { field: 'session_start_time', headerName: 'Start Time', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
    { field: 'session_end_time', headerName: 'End Time', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
    {
      field: 'trainer_info',
      headerName: 'Trainer Name',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 200,
      renderCell: params => (
        <div >
          {params?.row?.trainer_info?.fullName}
        </div>
      )
    },
    {
      field: 'trainee_info',
      headerName: 'Trainee Name',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 200,
      renderCell: params => (
        <div >
          {params?.row?.trainee_info?.fullName}
        </div>
      )
    },
    {
      field: 'status',
      headerName: 'Actions',
      headerClassName: styles['header-class-last'],
      cellClassName: styles['cell-class-last'],
      width: 350,
      renderCell: params => (
        <>
          <div className={styles["status-booking"]} style={{ backgroundColor: booking_status[params.row.status], cursor: "not-allowed" }}>
            {params.row.status}
          </div>
          {
            params.row.status === "canceled" ? params?.row?.refund_status === "refunded" ?
              <div className={styles["status-booking"]} style={{ backgroundColor: "gray", marginLeft: "10px", cursor: "not-allowed" }}>
                {params?.row?.refund_status}
              </div> :
              canRefund ? (
              <div onClick={() => showRefundPopup(params.row)} className={styles["status-booking"]} style={{ backgroundColor: "#2d2d3f", marginLeft: "10px", cursor: "pointer", }}>
                Start Refund
              </div>
              ) : (
              <div className={styles["status-booking"]} style={{ backgroundColor: "#555", marginLeft: "10px", cursor: "not-allowed" }} title="No refund permission">
                Refund (restricted)
              </div>
              ) : null
          }

          {
            params.row.status === BookedSession.booked ?
              isCurrentDateBefore(params.row.start_time) ?
                <React.Fragment>
                  <button
                    className={styles["status-booking"]}
                    type="button"
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#000080",
                      marginLeft: "10px"
                    }}
                    disabled={params.row.status !== BookedSession.booked}
                    onClick={() => onConfirmBooking(params.row._id)}
                  >
                    {BookedSession.confirm}
                  </button>
                  <button
                    className={styles["status-booking"]}
                    type="button"
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#ff4e2b",
                      marginLeft: "10px"
                    }}
                    // disabled={params.row.status !== BookedSession.booked}
                    onClick={() => {
                      // onCancelBooking(params.row._id)
                      setOpenClosePopup(true);
                      setCancelId(params.row._id)
                    }}
                  // onClick={() => onCancelBooking(params.row._id)}
                  >
                    Cancel
                  </button>
                </React.Fragment> :
                <React.Fragment>
                  <div className={styles["status-booking"]} style={{ backgroundColor: booking_status["canceled"], marginLeft: "10px", cursor: "not-allowed" }}>
                    Not Accpted
                  </div>

                  {
                    params?.row?.refund_status === "refunded" ?
                      <div className={styles["status-booking"]} style={{ backgroundColor: "gray", marginLeft: "10px" }}>
                        {params?.row?.refund_status}
                      </div> :
                      canRefund ? (
                      <div onClick={() => showRefundPopup(params.row)} className={styles["status-booking"]} style={{ backgroundColor: "#2d2d3f", marginLeft: "10px", cursor: "pointer", }}>
                        Start Refund
                      </div>
                      ) : (
                      <div className={styles["status-booking"]} style={{ backgroundColor: "#555", marginLeft: "10px", cursor: "not-allowed" }}>
                        Refund (restricted)
                      </div>
                      )
                  }
                </React.Fragment>
              : null
          }

          {
            params.row.status === BookedSession.confirmed &&
            // isCurrentDateBefore(params.row.start_time) &&
            <React.Fragment>
              <button
                className={styles["status-booking"]}
                type="button"
                style={{
                  cursor: "pointer",
                  backgroundColor: "#ff4e2b",
                  marginLeft: "10px"
                }}
                // disabled={params.row.status !== BookedSession.booked}
                // onClick={() => onCancelBooking(params.row._id)}
                onClick={() => {
                  setOpenClosePopup(true);
                  setCancelId(params.row._id)
                }}
              >
                Cancel
              </button>
            </React.Fragment>
          }

        </>
      )
    }

  ];

  const handleCloseRefundPopup = () => {
    setOpenRefundPopup(false);
    setRefundRow(null);
  }

  const handleCloseCancelPopup = () => {
    setOpenClosePopup(false);
    setCancelId(null)
  }

  const onConformRefund = (paymentIntentId, reason) => {
    startRefund({ payment_intent_id: paymentIntentId, booking_id: bookingId, reason })
  }

  const onConformCancel = (id) => {
    // startRefund({ payment_intent_id: id })
    onCancelBooking(cancelId)
  }

  const getRowClassName = (params) => {
    return params.indexRelativeToCurrentPage % 2 === 0 ? `${styles['even-row']} ${styles['row-class']} ` : `${styles['odd-row']} ${styles['row-class']} `;
  };

  const getRowHeight = () => 50

  const getPaymentIntentDetails = (params) => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {}),
      },
      body: JSON.stringify(params),
    };
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/transaction/get-payment-intent', options)
      .then(data => {
        return data.json();
      }).then(response => {
        if (response.code === 400) {
          // setLoading(false)
          return;
        }
        // console.log("========>", response)
        setPaymentIntentDetails(response?.data ?? {})
      }).catch(e => {
        // setLoading(false)
      });

  }

  function onConfirmBooking(id) {
    const payload = {
      booked_status: "confirmed",
      id: id
    }
    updateBooking(payload)
  }

  function onCancelBooking(id) {
    // console.log("====>", id)
    const payload = {
      booked_status: "canceled",
      id: id
    }
    updateBooking(payload)
  }

  const updateBooking = (params) => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
      },
      body: JSON.stringify(params),
    };
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + `/user/update-booked-session/${params.id}`, options)
      .then(data => {
        return data.json();
      }).then(response => {
        getBookingList();
        handleCloseCancelPopup()
      }).catch(e => {
      });

  }

  const startRefund = (params) => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!storedToken) {
      toast.error('Sign in required to process refunds')
      return
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
      },
      body: JSON.stringify(params),
    };
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/transaction/create-refund', options)
      .then(data => {
        return data.json();
      }).then(response => {
        if (response.code === 400 || response.code === 403 || String(response?.status).toLowerCase() === 'fail') {
          toast.error(response?.error || 'Refund was not completed')
          return;
        }
        toast.success('Refund completed; amount returns to the trainee funding source.', {
          duration: 2000
        })
        updateRefundStatus({
          "booking_id": bookingId,
          "refund_status": "refunded"
        })
      }).catch(e => {
        toast.error(e?.message || 'Refund request failed')
      });

  }

  const updateRefundStatus = (params) => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!storedToken) {
      return
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
      },
      body: JSON.stringify(params),
    };
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/user/update-refund-status', options)
      .then(data => {
        return data.json();
      }).then(response => {
        if (response.code === 400) {
          return;
        }
        getBookingList();
        setBookingId(null)
        setPaymentIntentDetails({})
        setOpenRefundPopup(false)
      }).catch(e => {
      });

  }

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (bookingList) {
      setTableData(bookingList)
    }
  }, [bookingList])

  async function getSearchValue(searchText) {
    const searchResults = await debouncedSearchMedicine(searchText, bookingList, "_id")
    setTableData(searchResults)
  }


  return (
    <>
      <Grid container spacing={3} sx={{ width: "100%" }}>
        <Grid item xs={12} md={12} lg={12} xl={12} >
          <form noValidate autoComplete="off" >
            <Container maxWidth="xl">
              <Box sx={{ background: "white", padding: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={6} lg={6}>
                    <Typography sx={{ color: "black", fontSize: "18px", fontWeight: "600" }} >Booking List</Typography>
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
                        onChange={(e) => getSearchValue(e.target.value)}
                      />
                    </Box>

                  </Grid>

                  <div style={{ height: "71vh", width: '100%' }}>
                    <DataGrid
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
                      columnHeaderHeight={50}
                    />
                  </div>

                </Grid>
              </Box>
            </Container>
          </form>
        </Grid>
      </Grid>

      <RefundPopups paymentIntentDetails={paymentIntentDetails} bookingPreview={refundRow} handleClose={handleCloseRefundPopup} open={openRefundPopup} onConform={onConformRefund} />

      <CancelSessionPopups handleClose={handleCloseCancelPopup} open={openClosePopup} onConform={onConformCancel} />
    </>
  )
}



