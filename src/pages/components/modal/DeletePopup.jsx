import * as React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { CustomButton } from "../common";
import Modal from "./Modal";
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export default function DeletePopup({ handleClose, open, onConform }) {

  return (
    <Modal handleClose={handleClose} open={open} maxWidth="xs">
      <Box>
        <Box padding={"2rem"} >
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: "600" }}>
            Are You sure wants to delete ?
          </Typography>
          <Box paddingTop={"1rem"}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} />
              <Grid item xs={12} sm={5} />
              <Grid container justifyContent={"center"}>
                <CustomButton
                  onClick={handleClose}
                  variant='contained'
                  startIcon={<CancelPresentationIcon />} sx={{ marginRight: "10px", backgroundColor: "gray", color: "white" }}>
                  Cancel
                </CustomButton>
                <CustomButton
                  onClick={onConform}
                  variant='contained'
                  startIcon={<DeleteForeverIcon />} sx={{ marginLeft: "10px", backgroundColor: "red", color: "white" }}>
                  Delete
                </CustomButton>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}


