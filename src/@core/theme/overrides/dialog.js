const Dialog = skin => {
  return {
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          boxShadow: theme.shadows[skin === 'bordered' ? 0 : 10],
          ...(skin === 'bordered' && { border: `1px solid ${theme.palette.divider}` }),
          '&:not(.MuiDialog-paperFullScreen)': {
            [theme.breakpoints.down('sm')]: {
              margin: theme.spacing(1.5),
              width: `calc(100% - ${theme.spacing(3)})`,
              maxWidth: `calc(100% - ${theme.spacing(3)}) !important`,
              maxHeight: `calc(100% - ${theme.spacing(3)})`
            }
          },
          '& > .MuiList-root': {
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1)
          }
        })
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(5),
          [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(2)
          }
        })
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(5),
          [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(2)
          },
          '& + .MuiDialogContent-root': {
            paddingTop: 0
          },
          '& + .MuiDialogActions-root': {
            paddingTop: 0
          }
        })
      }
    },
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(5),
          [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(2)
          },
          '&.dialog-actions-dense': {
            padding: theme.spacing(2.5),
            paddingTop: 0
          }
        })
      }
    }
  }
}

export default Dialog
