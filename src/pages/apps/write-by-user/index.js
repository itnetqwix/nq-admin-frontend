import { Box, InputLabel, TextField } from "@mui/material";
import React, { useEffect } from "react";

import styles from "styles/common.module.css";

import { DataGrid } from '@mui/x-data-grid';
import Link from "next/link";
import MenuIcon from '@mui/icons-material/Menu';
import { CustomButton } from "src/pages/components/common";
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell';
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
          <Link href={`/apps/users/${uid}`} style={{ color: '#2563EB', fontWeight: 500 }}>
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

  const getRowHeight = () => 50

  return (
    <form noValidate autoComplete='off'>
      <AdminPageShell
        title='User feedback'
        subtitle='Contact-us tickets and status. Open User 360 for full context.'
        actions={
          <CustomButton component={Link} variant='contained' href='/apps/booking' startIcon={<MenuIcon />}>
            Settings
          </CustomButton>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <InputLabel sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Search</InputLabel>
            <TextField size='small' placeholder='Filter in table…' />
          </Box>
          <div className='admin-data-grid' style={{ height: '71vh', width: '100%' }}>
            <DataGrid
              rows={writeByUsers ?? []}
              columns={columns}
              headerClassName={styles['header-class']}
              getRowClassName={getRowClassName}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 }
                }
              }}
              pageSizeOptions={[25, 50]}
              getRowHeight={getRowHeight}
              columnHeaderHeight={50}
            />
          </div>
        </AdminPageSection>
      </AdminPageShell>
    </form>
  )
}