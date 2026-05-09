import { Box, Button, Chip, InputLabel, Stack, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import styles from "styles/common.module.css";
import { getImageUrl } from "src/utils/utils";
import { useAdminRealtime } from "src/context/AdminRealtimeContext";
import AdminPageShell, { AdminPageSection } from "src/layouts/components/AdminPageShell";



export default function ActiveUsersTable() {
    const { onlineUsers, socketConnected, refreshOnlineUsers } = useAdminRealtime();
    const [trainerList, setTrainerList] = useState([]);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        const rows = (onlineUsers || []).map(u => ({
            ...u,
            id: u._id || u.id,
            presence: 'Online'
        }));
        setTrainerList(rows);
    }, [onlineUsers]);

    useEffect(() => {
        setTableData(trainerList);
    }, [trainerList]);

    const columns = [
        {
            field: 'image',
            headerName: 'Image',
            headerClassName: styles['header-class'],
            cellClassName: styles['cell-class'],
            width: 120,
            renderCell: params => (
                <img
                    alt='Profile'
                    src={getImageUrl(params?.row?.profile_picture) ?? 'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'}
                    style={{ width: 'auto', height: '45px', borderRadius: '50%' }}
                />
            )
        },
        { field: 'fullname', headerName: 'Full Name', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 180 },
        { field: 'email', headerName: 'Email', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 200 },
        { field: 'mobile_no', headerName: 'Mobile Number', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
        { field: 'category', headerName: 'Category', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 100 },
        { field: 'wallet_amount', headerName: 'Wallet Amount', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
        { field: 'commission', headerName: 'Commission (%)', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
        { field: 'login_type', headerName: 'Login Type', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
        { field: 'account_type', headerName: 'Account Type', headerClassName: styles['header-class'], cellClassName: styles['cell-class'], width: 150 },
        {
            field: 'presence',
            headerName: 'Presence',
            headerClassName: styles['header-class'],
            cellClassName: styles['cell-class'],
            width: 110,
            renderCell: () => (
                <Chip size='small' label='Online' color='success' variant='outlined' />
            )
        },
    ];

    const handleSearch = (searchText) => {
        const filteredData = trainerList.filter(trainer =>
            trainer.fullname.toLowerCase().includes(searchText.toLowerCase())
        );
        setTableData(filteredData);
    };

    return (
        <Box sx={{ mt: 4, width: '100%' }}>
        <AdminPageShell
            title='Who is online now'
            subtitle='Trainers and trainees currently connected. Data refreshes over the admin realtime channel.'
            actions={
                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                    <Chip
                        size='small'
                        label={socketConnected ? 'Live · WebSocket' : 'Connecting…'}
                        color={socketConnected ? 'success' : 'default'}
                        variant={socketConnected ? 'filled' : 'outlined'}
                    />
                    <Button size='small' variant='outlined' onClick={() => void refreshOnlineUsers()}>
                        Refresh from API
                    </Button>
                </Stack>
            }
            contentSx={{ p: 0 }}
        >
            <AdminPageSection>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <InputLabel sx={{ color: 'text.secondary', fontSize: '0.875rem', mr: 0.5 }}>Search</InputLabel>
                    <TextField size='small' placeholder='Name…' onChange={e => handleSearch(e.target.value)} />
                </Box>
                <div className='admin-data-grid' style={{ height: '71vh', width: '100%' }}>
                    <DataGrid
                        rows={tableData ?? []}
                        columns={columns}
                        headerClassName={styles['header-class']}
                        pagination
                        pageSizeOptions={[25, 50]}
                        disableSelectionOnClick
                        autoHeight
                    />
                </div>
            </AdminPageSection>
        </AdminPageShell>
        </Box>
    );
}
