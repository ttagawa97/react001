import { Alert, AlertDescription, AlertIcon, Box, Button, Progress } from '@chakra-ui/react'

export function ApiErrorBanner({ message, onClose }) {
  return (
    <Alert
      status="error"
      variant="subtle"
      borderRadius="24px"
      border="1px solid"
      borderColor="red.700"
      bg="rgba(69, 10, 10, 0.92)"
      color="red.100"
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
        borderColor="whiteAlpha.200"
        bg="rgba(18, 27, 43, 0.94)"
        borderRadius="24px"
        px="5"
        py="4"
        backdropFilter="blur(14px)"
      >
        <Box color="cyan.200" fontWeight="700" mb="3">{children}</Box>
        <Progress value={78} size="xs" colorScheme="cyan" borderRadius="full" bg="whiteAlpha.100" isIndeterminate />
      </Box>
    </Box>
  )
}
