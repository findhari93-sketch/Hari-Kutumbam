'use client';
import { createTheme, alpha } from '@mui/material/styles';
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB', // Vibrant Blue
      light: '#60A5FA',
      dark: '#1E40AF',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7C3AED', // Modern Violet
      light: '#A78BFA',
      dark: '#5B21B6',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F8FAFC', // Cool Slate
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#64748B', // Slate 500
    },
    grey: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      800: '#1E293B',
      900: '#0F172A',
    },
    action: {
      hover: alpha('#2563EB', 0.04),
      selected: alpha('#2563EB', 0.08),
    },
  },
  shape: {
    borderRadius: 8, // Standard professional radius
  },
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: { fontFamily: outfit.style.fontFamily, fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontFamily: outfit.style.fontFamily, fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontFamily: outfit.style.fontFamily, fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em' },
    h4: { fontFamily: outfit.style.fontFamily, fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em' },
    h5: { fontFamily: outfit.style.fontFamily, fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontFamily: outfit.style.fontFamily, fontSize: '1rem', fontWeight: 600 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, letterSpacing: '0.01em' },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600, color: '#64748B' },
    button: { textTransform: 'none', fontWeight: 600, fontFamily: outfit.style.fontFamily, letterSpacing: '0.01em' },
    body1: { lineHeight: 1.6 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F8FAFC',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #EFF6FF 0%, transparent 40%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Professional button
          padding: '8px 20px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px rgba(37, 99, 235, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        },
        contained: {
          '&:active': {
            boxShadow: 'none',
            transform: 'translateY(1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(226, 232, 240, 0.8)', // Subtle border
          backgroundImage: 'none',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s',
            '& fieldset': {
              borderColor: '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: '#94A3B8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563EB',
              borderWidth: 2,
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
            }
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
        filled: {
          border: '1px solid transparent',
        },
        outlined: {
          borderColor: '#E2E8F0',
          backgroundColor: 'transparent',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          boxShadow: '20px 0 40px -10px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 12px',
          padding: '10px 16px',
          transition: 'all 0.2s',
          '&.Mui-selected': {
            backgroundColor: alpha('#2563EB', 0.1),
            color: '#2563EB',
            '& .MuiListItemIcon-root': {
              color: '#2563EB',
            },
            '&:hover': {
              backgroundColor: alpha('#2563EB', 0.15),
            },
          },
          '&:hover': {
            backgroundColor: '#F1F5F9',
            paddingLeft: '20px', // Subtle slide effect
          },
        },

      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: '#64748B',
        }
      }
    }
  },
});

export default theme;
