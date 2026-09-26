import { ops } from 'src/styles/opsSurface'

/**
 * NetQwix admin — Ops Surface component defaults (merged into MUI theme).
 * Accordion / Card chrome lives here — not per-page wrappers.
 */
const UserThemeOptions = () => {
  const hairline = theme => theme.palette.divider
  const cardShadow = ops.shadowCard

  return {
    shape: {
      borderRadius: 8
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            overflowX: 'clip',
            WebkitTextSizeAdjust: '100%',
            textSizeAdjust: '100%'
          },
          body: {
            fontFeatureSettings: '"ss01", "ss02", "tnum"',
            WebkitFontSmoothing: 'antialiased',
            overflowX: 'clip',
            minHeight: '100dvh',
            overscrollBehaviorX: 'none',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)'
          },
          '#__next': {
            minHeight: '100dvh',
            minWidth: 0
          },
          'img, video': {
            maxWidth: '100%',
            height: 'auto'
          },
          '::selection': {
            backgroundColor: ops.ink,
            color: '#F2F2F2'
          },
          code: {
            fontFamily: ops.mono
          }
        }
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 6,
            letterSpacing: '-0.16px'
          },
          sizeSmall: {
            padding: '6px 12px',
            fontSize: '0.875rem',
            borderRadius: 6
          },
          sizeMedium: {
            padding: '8px 16px',
            fontSize: '0.875rem'
          },
          sizeLarge: {
            padding: '10px 20px',
            fontSize: '1rem',
            borderRadius: 9999
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' }
          },
          containedPrimary: {
            // Ink primary CTA for high-authority actions; indigo still available via color="info"
          },
          outlined: {
            borderColor: hairline
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            },
            [theme.breakpoints.down('sm')]: {
              minWidth: 40,
              minHeight: 40
            }
          })
        }
      },
      MuiCard: {
        defaultProps: {
          elevation: 0
        },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            boxShadow: theme.palette.mode === 'dark' ? ops.shadowCard : cardShadow,
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            backgroundImage: 'none',
            backgroundColor: theme.palette.mode === 'dark' ? '#121826' : ops.canvas,
            color: theme.palette.text.primary,
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)'
            }
          })
        }
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0
        },
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.mode === 'dark' ? '#121826' : theme.palette.background.paper,
            color: theme.palette.text.primary
          }),
          outlined: ({ theme }) => ({
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: cardShadow
          })
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 6,
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.common.white : undefined,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.grey[400]
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 1
            }
          }),
          input: ({ theme }) => ({
            fontSize: '0.875rem',
            // ponytail: iOS zooms focused inputs under 16px; keep 14px on desktop
            [theme.breakpoints.down('sm')]: {
              fontSize: '16px'
            }
          })
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 9999
          },
          sizeSmall: {
            height: 22,
            fontSize: '0.6875rem',
            fontFamily: ops.mono
          }
        }
      },
      MuiAccordion: {
        defaultProps: {
          disableGutters: true,
          elevation: 0
        },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: `${ops.radiusLg} !important`,
            boxShadow: cardShadow,
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            backgroundColor: theme.palette.mode === 'dark' ? '#121826' : ops.canvas,
            '&:before': { display: 'none' },
            '&.Mui-expanded': { margin: 0 },
            '& + &': { marginTop: 12 }
          })
        }
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: ({ theme }) => ({
            minHeight: 48,
            paddingLeft: 20,
            paddingRight: 16,
            [theme.breakpoints.down('sm')]: {
              paddingLeft: 12,
              paddingRight: 12
            },
            '& .MuiAccordionSummary-content': {
              margin: '12px 0',
              fontWeight: 600,
              letterSpacing: '-0.28px',
              color: theme.palette.text.primary
            }
          })
        }
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: ({ theme }) => ({
            padding: '8px 20px 20px',
            borderTop: `1px solid ${theme.palette.divider}`,
            [theme.breakpoints.down('sm')]: {
              padding: '8px 12px 16px'
            }
          })
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            letterSpacing: '-0.16px',
            minHeight: 40
          }
        }
      },
      MuiTabs: {
        defaultProps: {
          variant: 'scrollable',
          scrollButtons: 'auto',
          allowScrollButtonsMobile: true
        },
        styleOverrides: {
          root: {
            minHeight: 44
          },
          indicator: ({ theme }) => ({
            height: 2,
            borderRadius: 1,
            backgroundColor: theme.palette.mode === 'light' ? ops.ink : theme.palette.primary.main
          })
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.customColors.tableHeaderBg,
            '& .MuiTableCell-head': {
              fontFamily: ops.mono,
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: theme.palette.text.disabled,
              borderBottom: `1px solid ${theme.palette.divider}`
            }
          })
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
            fontSize: '0.875rem'
          })
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 12,
            boxShadow:
              '0px 1px 1px #00000005, 0px 8px 16px -4px #0000000a, 0px 24px 32px -8px #0000000f',
            [theme.breakpoints.down('sm')]: {
              borderRadius: 10
            }
          })
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderColor: theme.palette.divider,
            maxWidth: '100vw',
            [theme.breakpoints.down('sm')]: {
              maxWidth: '100%'
            }
          })
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            boxShadow: 'none',
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(14, 19, 31, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)'
          })
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            borderRadius: 6,
            fontSize: '0.75rem',
            fontWeight: 500,
            backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#0F172A',
            color: '#F8FAFC',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }),
          arrow: ({ theme }) => ({
            color: theme.palette.mode === 'dark' ? '#1E293B' : '#0F172A'
          })
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 6
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider
          })
        }
      }
    }
  }
}

export default UserThemeOptions
