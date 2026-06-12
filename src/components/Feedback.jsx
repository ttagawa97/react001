import { Alert, AlertDescription, AlertIcon, Box, Button, Progress } from '@chakra-ui/react'

export function ApiErrorBanner({ message, onClose }) {
  return (
    <Alert
      status="error"
      variant="subtle"
      borderRadius="24px"
      border="1px solid"
      borderColor="red.100"
      bg="rgba(255, 245, 245, 0.95)"
      color="red.700"
      alignItems="center"
      justifyContent="space-between"
      gap="3"
      px="5"
      py="4"
      mx={{ base: 4, md: 7 }}
      mt="4"
    >
      <Box display="flex" alignItems="center" gap="3">
        <AlertIcon />
        <AlertDescription fontWeight="600">{message}</AlertDescription>
      </Box>
      <Button type="button" variant="ghost" size="sm" onClick={onClose}>閉じる</Button>
    </Alert>
  )
}

export function LoadingStrip({ children = 'APIからデータを取得しています...' }) {
  return (
    <Box mx={{ base: 4, md: 7 }} mt="4">
      <Box
        border="1px solid"
        borderColor="brand.100"
        bg="rgba(255, 255, 255, 0.82)"
        borderRadius="24px"
        px="5"
        py="4"
        backdropFilter="blur(14px)"
      >
        <Box color="brand.700" fontWeight="700" mb="3">{children}</Box>
        <Progress value={78} size="xs" colorScheme="purple" borderRadius="full" bg="brand.50" isIndeterminate />
      </Box>
    </Box>
  )
}
