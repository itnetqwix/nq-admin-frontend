import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from 'react'

export const CustomButton = styled(Button)(({ theme }) => ({
    textTransform: "capitalize",
    fontWeight: "600",
    borderRadius: "0px",
}));

export default function Common() {
    return (
        <div>

        </div>
    )
}

