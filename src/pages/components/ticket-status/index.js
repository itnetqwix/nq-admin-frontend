import { FormControl, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import { statusColors, updateTicketBaseUrl } from "src/utils/utils";
import authConfig from 'src/configs/auth'

export default function TicketStatusComponent({ params, base, cb }) {
    const [status, setStatus] = useState(params.row.ticket_status);

    const handleChange = (event) => {
        setStatus(event.target.value)
        updateStatus({ id: params.row._id, ticket_status: event.target.value })
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
        fetch(process.env.NEXT_PUBLIC_API_BASE_URL + `/user/${base}`, options)
            .then(data => {
                return data.json();
            }).then(response => {
                if (response.code === 400) {
                    return;
                }
                cb();
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
                    background: statusColors[status],
                }}
            >
                <MenuItem value="open" style={{ color: statusColors.open }}>Open</MenuItem>
                <MenuItem value="in_progress" style={{ color: statusColors.in_progress }}>In Progress</MenuItem>
                <MenuItem value="close" style={{ color: statusColors.close }}>Close</MenuItem>
            </Select>
        </FormControl>
    );
};

