// ** NetQwix admin — minimalist component defaults (merged into MUI theme)
const UserThemeOptions = () => ({
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 10
        },
        sizeSmall: {
          padding: '6px 14px'
        },
        sizeMedium: {
          padding: '8px 18px'
        },
        sizeLarge: {
          padding: '10px 22px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'none'
        })
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.common.white : undefined
        })
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500
        }
      }
    }
  }
})

export default UserThemeOptions
