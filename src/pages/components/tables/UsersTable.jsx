import { Box, Chip, Divider, Grid, InputLabel, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { DataGrid } from '@mui/x-data-grid';
import styles from "styles/common.module.css";
import { getImageUrl } from "src/utils/utils";
import { useAdminRealtime } from "src/context/AdminRealtimeContext";



export default function ActiveUsersTable() {
    const { onlineUsers, socketConnected } = useAdminRealtime();
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
        <Box sx={{ background: "white", padding: 4, marginTop: '24px' }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Typography sx={{ color: "black", fontSize: "18px", fontWeight: "600" }}>
                            Active User List (Trainers and Trainees)
                        </Typography>
                        <Chip
                            size='small'
                            label={socketConnected ? 'Live · WebSocket' : 'Connecting…'}
                            color={socketConnected ? 'success' : 'default'}
                            variant={socketConnected ? 'filled' : 'outlined'}
                        />
                    </Box>
                    <Divider sx={{ margin: "10px 0" }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2 }}>
                        <InputLabel sx={{ color: "black", fontSize: "14px", marginRight: 1 }}>Search</InputLabel>
                        <TextField
                            size="small"
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </Box>
                    <div style={{ height: "71vh", width: '100%' }}>
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
                </Grid>
            </Grid>
        </Box>
    );
}
