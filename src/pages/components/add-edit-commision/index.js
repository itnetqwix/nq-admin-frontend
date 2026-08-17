import React from 'react'
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import CheckIcon from '@mui/icons-material/Check';
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CustomButton } from '../common';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import { useCommon } from 'src/hooks/useCommon';

const defaultValues = {
  commission: '',
  surge_multiplier_cap_bps: '',
  surge_opt_out: false,
};

const schema = yup.object().shape({
  // Blank = use Pricing defaultCommissionRate (no frozen override).
  commission: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' || o == null ? null : v))
    .min(0, "Commission should be at least 0")
    .max(100, "Commission should be at most 100"),
  surge_multiplier_cap_bps: yup
    .number()
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .min(0, 'Cap must be ≥ 0')
    .max(10000, 'Cap is in basis points (10000 = 100%)'),
  surge_opt_out: yup.boolean(),
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
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  });

  const updateCommision = (data) => {
    const payload = {
      trainer_id,
      commission:
        data.commission === '' || data.commission == null ? null : data.commission,
      surge_multiplier_cap_bps:
        data.surge_multiplier_cap_bps === '' || data.surge_multiplier_cap_bps == null
          ? null
          : data.surge_multiplier_cap_bps,
      surge_opt_out: !!data.surge_opt_out,
    }

    updateCommission(payload);
  }

  return (
    <Box>
      <Box padding={"1rem"}>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: "600" }}>
          Edit commission
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
          Leave blank to use the Pricing default. Enter a percent only to override for this coach.
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
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      fullWidth
                      type='number'
                      size="small"
                      label="Override commission (%)"
                      placeholder="Blank = Pricing default"
                      autoComplete="off"
                      InputProps={{
                        style: {
                          boxShadow: ' 0px 0px 40px 0px rgba(59, 59, 61, 0.20)',
                          border: '1px solid #48BDFF',
                          borderRadius: "5px"
                        },
                      }}
                      error={Boolean(errors?.commission)}
                      value={value ?? ''}
                      onBlur={onBlur}
                      onChange={onChange}
                      helperText={errors?.commission?.message || 'Blank clears override and uses live Pricing default'}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <Controller
                  name='surge_multiplier_cap_bps'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      fullWidth
                      type='number'
                      size="small"
                      label="Surge cap (bps)"
                      autoComplete="off"
                      value={value ?? ''}
                      onChange={onChange}
                      helperText={errors?.surge_multiplier_cap_bps?.message}
                      error={Boolean(errors?.surge_multiplier_cap_bps)}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <Controller
                  name='surge_opt_out'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <FormControlLabel
                      control={<Switch checked={!!value} onChange={e => onChange(e.target.checked)} />}
                      label="Opt out of surge"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <Box display="flex" gap={1} justifyContent="flex-end">
                  <CustomButton
                    onClick={handleClose}
                    startIcon={<CancelPresentationIcon />}
                    variant="outlined"
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    startIcon={<CheckIcon />}
                    variant="contained"
                  >
                    Save
                  </CustomButton>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Box>
    </Box>
  )
}
