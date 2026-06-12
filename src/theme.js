import { extendTheme } from '@chakra-ui/react'

const pastelTheme = extendTheme({
  fonts: {
    heading: "'Avenir Next', 'Segoe UI', sans-serif",
    body: "'Avenir Next', 'Segoe UI', sans-serif",
  },
  colors: {
    brand: {
      50: '#f5f7ff',
      100: '#e6ebff',
      200: '#ccd7ff',
      300: '#b3c3ff',
      400: '#92acef',
      500: '#728fce',
      600: '#5b72a7',
      700: '#465980',
      800: '#333f59',
      900: '#202735',
    },
    mint: {
      50: '#f2fffb',
      100: '#daf9ef',
      200: '#b8f0dc',
      300: '#8fdfc5',
      400: '#68cdb0',
      500: '#4eb29a',
      600: '#3b8d7b',
      700: '#2c695d',
      800: '#1f473f',
      900: '#122722',
    },
    peach: {
      50: '#fff7f3',
      100: '#ffe8dd',
      200: '#ffd4c0',
      300: '#ffbea2',
      400: '#f7a788',
      500: '#df8868',
      600: '#b56b4f',
      700: '#8a513c',
      800: '#5f372a',
      900: '#341d17',
    },
  },
  styles: {
    global: {
      'html, body': {
        background:
          'linear-gradient(180deg, #f8f6ff 0%, #f6fbff 50%, #f4fbf8 100%)',
        color: '#25324a',
      },
      body: {
        minWidth: '320px',
      },
      '#root': {
        minHeight: '100vh',
      },
      '::selection': {
        background: '#ccd7ff',
      },
    },
  },
  radii: {
    md: '14px',
    lg: '20px',
  },
  shadows: {
    outline: '0 0 0 3px rgba(146, 172, 239, 0.35)',
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'full',
        fontWeight: '700',
      },
      variants: {
        solid: {
          bg: 'brand.400',
          color: 'white',
          _hover: { bg: 'brand.500' },
          _active: { bg: 'brand.600' },
        },
        outline: {
          bg: 'whiteAlpha.800',
          borderColor: 'brand.200',
          color: 'brand.700',
          _hover: { bg: 'brand.50' },
        },
        ghost: {
          color: 'brand.700',
          _hover: { bg: 'brand.50' },
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.300',
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'brand.300',
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'brand.300',
      },
    },
  },
})

export default pastelTheme
