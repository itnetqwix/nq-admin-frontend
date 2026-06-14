import React, { useEffect } from "react";

import styles from "styles/common.module.css";

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import Link from "next/link";
import MenuIcon from '@mui/icons-material/Menu';
import { CustomButton } from "src/pages/components/common";
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell';
import { useCommon } from "src/hooks/useCommon";
import moment from "moment";
import { updateTicketBaseUrl } from "src/utils/utils";
import TicketStatusComponent from "src/pages/components/ticket-status";

// const useStyles = makeStyles((theme) => ({
//   selectRoot: {
//     backgroundColor: '#f5f5f5', // Set dropdown background color
//   },
//   menuItemSelected: {
//     backgroundColor: theme.palette.primary.main, // Use Material UI's primary color for selected item
//   },
// }));


const statusColors = {
  open: 'green',
  in_progress: 'orange',
  close: 'red',
};

// const TicketStatusComponent = ({ params }) => {
//   const [status, setStatus] = useState(params.row.ticket_status);

//   // const classes = useStyles();

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
//         // classes={{ root: classes.selectRoot }}
//         >
//           <MenuItem value={"open"} style={{ color: statusColors.open }}>Open</MenuItem>
//           <MenuItem value={"in_progress"} style={{ color: statusColors.in_progress }}>In Progress</MenuItem>
//           <MenuItem value={"close"} style={{ color: statusColors.close }}>Close</MenuItem>
//         </Select>
//       </FormControl>
//     </div>
//   );
// };

export default function ConcernByUsers() {
  const common = useCommon();
  const [search, setSearch] = React.useState('');
  const [reasonFilter, setReasonFilter] = React.useState('');

  const {
    concernByUsers,
    getConcernByUsers,
  } = common;

  useEffect(() => {
    getConcernByUsers();
  }, [])

  const filteredRows = React.useMemo(() => {
    let rows = concernByUsers ?? [];
    if (reasonFilter) {
      rows = rows.filter(row => String(row.reason ?? '') === reasonFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row => {
      const hay = [
        row.name,
        row.email,
        row.subject,
        row.reason,
        row.description,
        row.user_info?.email,
        row.user_info?.fullName
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [concernByUsers, search, reasonFilter]);

  const columns = [
    { field: 'name', headerName: 'Name', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'email', headerName: 'Email', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'phone_number', headerName: 'Phone Number', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'reason', headerName: 'Reason', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
    { field: 'is_releted_to_refund', headerName: 'Refund Request', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
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
          <Link href={`/apps/users/${uid}`} style={{ color: '#2563EB', fontWeight: 500 }}>
            Open
          </Link>
        )
      }
    },
    {
      field: '_id',
      headerName: 'Booking ID',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 300,
      renderCell: params => (
        <div >
          {params?.row?.booking_details?._id}
        </div>
      )
    },
    {
      field: 'booking_details',
      headerName: 'Booking Date',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 200,
      renderCell: params => (
        <div >
          {moment(params?.row?.booking_details?.booked_date).format('MM-DD-YY')}
        </div>
      )
    },
    {
      field: 'status',
      headerName: 'Booking status',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 200,
      renderCell: params => (
        <div >
          {params?.row?.booking_details?.status}
        </div>
      )
    },
    {
      field: 'amount',
      headerName: 'Booking Amount',
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      width: 200,
      renderCell: params => (
        <div >
          {params?.row?.booking_details?.amount}
        </div>
      )
    },
    {
      field: 'ticket_status',
      headerName: 'Status',
      headerClassName: styles['header-class-last'],
      cellClassName: styles['cell-class-last'],
      width: 200,
      renderCell: params => (
        <div className={styles["status-booking"]} >
          <TicketStatusComponent params={params} base={updateTicketBaseUrl.raise_concern} cb={getConcernByUsers} />
        </div>
      )
    }

  ];

  const getRowClassName = (params) => {
    return params.indexRelativeToCurrentPage % 2 === 0 ? `${styles['even-row']} ${styles['row-class']} ` : `${styles['odd-row']} ${styles['row-class']} `;
  };

  const getRowHeight = () => 50

  return (
    <form noValidate autoComplete='off'>
      <AdminPageShell
        title='Support tickets'
        subtitle='Raise concern workflow: status, refunds, and links to User 360.'
        actions={
          <CustomButton component={Link} variant='contained' href='/apps/booking' startIcon={<MenuIcon />}>
            Settings
          </CustomButton>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Search name, email, subject, reason…'
            searchValue={search}
            onSearchChange={e => setSearch(e.target.value)}
          />
          <Stack direction='row' spacing={1} sx={{ px: 2, pb: 1, flexWrap: 'wrap' }}>
            <Chip
              size='small'
              label='All reasons'
              color={reasonFilter === '' ? 'primary' : 'default'}
              onClick={() => setReasonFilter('')}
            />
            <Chip
              size='small'
              label='Coach left session'
              color={reasonFilter === 'coach_left_session' ? 'primary' : 'default'}
              onClick={() =>
                setReasonFilter(prev =>
                  prev === 'coach_left_session' ? '' : 'coach_left_session'
                )
              }
            />
          </Stack>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={filteredRows}
              columns={columns}
              getRowClassName={getRowClassName}
              getRowHeight={getRowHeight}
              columnHeaderHeight={50}
            />
          </AdminGridContainer>
        </AdminPageSection>
      </AdminPageShell>
    </form>
  )
}