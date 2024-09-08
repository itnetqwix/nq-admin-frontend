import * as React from 'react';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';

{/* <MenuItem value="xs">xs</MenuItem>
<MenuItem value="sm">sm</MenuItem>
<MenuItem value="md">md</MenuItem>
<MenuItem value="lg">lg</MenuItem>
<MenuItem value="xl">xl</MenuItem> */}

const ModalDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        border: "5px solid #14328d",
        borderRadius: "15px",
        maxHeight: '97%',
    },
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
}));

export default function Modal({ open, handleClose, maxWidth, children }) {

    return (
        <React.Fragment>
            <ModalDialog
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={open}
                maxWidth={maxWidth ?? "xs"}
            >
                <DialogContent dividers>
                    {children}
                </DialogContent>
            </ModalDialog>
        </React.Fragment>
    );
}