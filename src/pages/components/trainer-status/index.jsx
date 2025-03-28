import { FormControl, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import { trainerStatusColors, updateTicketBaseUrl } from "src/utils/utils";
import authConfig from 'src/configs/auth'

export default function TrainerStatus({ params, cb }) {
    const [status, setStatus] = useState(params.row.status);

    const handleChange = (event) => {
        setStatus(event.target.value)
        updateStatus({ trainer_id: params.row._id, status: event.target.value })
    }

    const updateStatus = (payload) => {
        const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
        if (!storedToken) {
            return
        }
        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedToken}`
            },
            body: JSON.stringify(payload),
        };
        fetch(process.env.NEXT_PUBLIC_API_BASE_URL + `/user/update-trainer-status`, options)
            .then(data => {
                return data.json();
            }).then(response => {
                if (response.code === 400) {
                    return;
                }
                // cb();
            }).catch(e => {
            });

    }
    return (
        <FormControl required sx={{ m: 1, minWidth: 120, height: '50px' }}>
            <Select
                labelId="demo-simple-select-required-label"
                id="demo-simple-select-required"
                value={status}
                onChange={handleChange}
                style={{
                    maxHeight: '40px',
                    marginTop: "5px",
                    color: "white",
                    background: trainerStatusColors[status],
                }}
            >
                <MenuItem value="pending" style={{ color: trainerStatusColors.open }}>Pending</MenuItem>
                <MenuItem value="approved" style={{ color: trainerStatusColors.in_progress }}>Approved</MenuItem>
                <MenuItem value="rejected" style={{ color: trainerStatusColors.close }}>Rejected</MenuItem>
            </Select>
        </FormControl>
    );
};

