import React from 'react'
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import CheckIcon from '@mui/icons-material/Check';
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CustomButton } from '../common';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import { useCommon } from 'src/hooks/useCommon';

const defaultValues = {
  commission: '',
};

const schema = yup.object().shape({
  commission: yup
    .number()
    .min(0, "Commission should be at list 0")
    .max(100, "Commission should be maximul 100")
    .required("Commission is Required"),
});

export default function AddEditCommision({ handleClose, trainer_id }) {
  const common = useCommon();
  const {
    updateCommission
  } = common;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  });

  console.log("data ===", errors)
  const updateCommision = (data) => {
    console.log("data ===", data)

    const payload = { trainer_id, commission: data.commission }

    updateCommission(payload);
  }

  return (
    <Box>
      <Box padding={"1rem"}>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: "600" }}>
          Edit commission
        </Typography>

        <Box paddingTop={"1rem"}>
          <form noValidate autoComplete="off"
            onSubmit={handleSubmit(updateCommision)}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={12}>
                <Controller
                  name='commission'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      required
                      fullWidth
                      type='number'
                      size="small"
                      autoComplete="off"
                      InputProps={{
                        style: {
                          boxShadow: ' 0px 0px 40px 0px rgba(59, 59, 61, 0.20)',
                          border: errors?.commission ? 'none' : '1px solid #48BDFF',
                          border: '1px solid #48BDFF',
                          borderRadius: "5px"
                        },
                      }}
                      error={Boolean(errors?.commission)}
                      value={value}
                      onChange={onChange}
                      helperText={errors?.commission?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} />
              <Grid item xs={12} sm={5} />

              <Grid container justifyContent={"right"}>
                {/* <CustomButton name={LABELS.CANCEL} backgroundColor="#3B3B3D" marginRight="1rem" textwidth="auto" onClick={handleClose} />
                <CustomButton type="submit" name={LABELS.SAVE} textwidth="auto" /> */}

                <CustomButton
                  onClick={handleClose}
                  variant='contained'
                  startIcon={<CancelPresentationIcon />} sx={{ marginRight: "10px", backgroundColor: "gray", color: "white" }}>
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  // onClick={onConform}
                  variant='contained'
                  startIcon={<CheckIcon />} sx={{ marginLeft: "10px", backgroundColor: "#14328d", color: "white" }}>
                  Update
                </CustomButton>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Box>
    </Box>
  )
}
