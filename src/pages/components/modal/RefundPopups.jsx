import * as React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { CustomButton } from "../common";
import Modal from "./Modal";
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import ReplayCircleFilledIcon from '@mui/icons-material/ReplayCircleFilled';

export default function RefundPopups({ paymentIntentDetails, handleClose, open, onConform }) {
  return (
    <Modal handleClose={handleClose} open={open} maxWidth="xs">
      <Box>
        <Box padding={"2rem"} >
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: "600" }}>
            Refund Details
          </Typography>
          <Box paddingTop={"1rem"}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={12}>
                <Typography>
                  Total Session cost: {paymentIntentDetails?.amount_received ? paymentIntentDetails?.amount_received / 100 : 0}$
                </Typography>
                <Typography>
                  Netqwix cost: {paymentIntentDetails?.application_fee_amount ? paymentIntentDetails?.application_fee_amount / 100 : 0}$
                </Typography>
                <Typography>
                  Payment Methord: {paymentIntentDetails?.payment_method_types ? paymentIntentDetails?.payment_method_types[0] : ""}
                </Typography>
              </Grid>
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
                  onClick={() => onConform(paymentIntentDetails.id)}
                  variant='contained'
                  startIcon={<ReplayCircleFilledIcon />} sx={{ marginLeft: "10px", backgroundColor: "green", color: "white" }}>
                  Refund
                </CustomButton>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}


