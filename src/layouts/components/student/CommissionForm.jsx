import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import authConfig from 'src/configs/auth'

const CommissionForm = (props) => {
  const [commission, setCommission] = useState('');
  const [error, setError] = useState('');

  const handleCommissionChange = (event) => {
    const value = event.target.value;
    // Check if value is a number between 0 and 100
    if (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 100) {
      setCommission(value);
      setError('');
    } else {
      setCommission(value);
      setError('Commission must be a number between 0 and 100');
    }
  };

  const updateCommssion = async (params, cb) => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
      },
      body: JSON.stringify(params),
    };
    return fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/admin/update-global-commission', options)
      .then(data => data.json()).then(res => cb()).catch(e => e);

  }

  function onSuccess() {
    props.getGlobalCommission()
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (/^\d+$/.test(commission) && parseInt(commission) >= 0 && parseInt(commission) <= 100) {
      console.log('Commission:', commission);
      updateCommssion({ commission }, onSuccess)
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 6 }}>
      <TextField
        id="commission"
        label="Commission (%)"
        variant="outlined"
        type="number"
        value={commission}
        onChange={handleCommissionChange}
        error={!!error}
        helperText={error}
      />
      <Button variant="contained" color="primary" type="submit">
        Add
      </Button>
    </Box>
  );
};

export default CommissionForm;
