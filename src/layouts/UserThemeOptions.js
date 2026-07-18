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
          body: {
            fontFeatureSettings: '"ss01", "ss02", "tnum"',
            WebkitFontSmoothing: 'antialiased'
          },
          '::selection': {
            backgroundColor: '#171717',
            color: '#F2F2F2'
          },
          code: {
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
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
            }
          })
        }
      },
      MuiCard: {
        defaultProps: {
          elevation: 0
        },
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: cardShadow,
            border: 'none',
            backgroundImage: 'none',
            backgroundColor: '#ffffff'
          }
        }
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          },
          outlined: {
            border: 'none',
            boxShadow: cardShadow
          }
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
          input: {
            fontSize: '0.875rem'
          }
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
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }
        }
      },
      MuiAccordion: {
        defaultProps: {
          disableGutters: true,
          elevation: 0
        },
        styleOverrides: {
          root: {
            borderRadius: `${ops.radiusLg} !important`,
            boxShadow: cardShadow,
            border: 'none',
            backgroundColor: ops.canvas,
            '&:before': { display: 'none' },
            '&.Mui-expanded': { margin: 0 },
            '& + &': { marginTop: 12 }
          }
        }
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 48,
            paddingLeft: 20,
            paddingRight: 16,
            '& .MuiAccordionSummary-content': {
              margin: '12px 0',
              fontWeight: 600,
              letterSpacing: '-0.28px',
              color: ops.ink
            }
          }
        }
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            padding: '8px 20px 20px',
            borderTop: `1px solid ${ops.hairline}`
          }
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
        styleOverrides: {
          indicator: ({ theme }) => ({
            height: 2,
            borderRadius: 1,
            backgroundColor: theme.palette.mode === 'light' ? '#171717' : theme.palette.primary.main
          })
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.customColors.tableHeaderBg,
            '& .MuiTableCell-head': {
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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
          paper: {
            borderRadius: 12,
            boxShadow:
              '0px 1px 1px #00000005, 0px 8px 16px -4px #0000000a, 0px 24px 32px -8px #0000000f'
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderColor: theme.palette.divider
          })
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            boxShadow: 'none',
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper
          })
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 6,
            fontSize: '0.75rem',
            fontWeight: 400
          }
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
