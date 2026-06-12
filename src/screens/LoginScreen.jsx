import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { api } from '../api'
import { formatApiError } from '../services/domain'

export function LoginScreen({ error, isSubmitting, onClearError, onLogin }) {
  const [mode, setMode] = useState('login')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [resetLoginId, setResetLoginId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [formError, setFormError] = useState('')
  const isResetMode = mode === 'password_reset'

  function clearErrors() {
    setFormError('')
    onClearError()
  }

  function changeMode(nextMode) {
    clearErrors()
    setResetMessage('')
    setMode(nextMode)
  }

  async function submitLogin(event) {
    event.preventDefault()
    clearErrors()
    try {
      await onLogin({ login_id: loginId, password })
    } catch (submitError) {
      setFormError(formatApiError(submitError))
    }
  }

  async function submitPasswordReset(event) {
    event.preventDefault()
    clearErrors()
    setResetMessage('')
    try {
      await api.executePasswordReset({
        login_id: resetLoginId,
        new_password: newPassword,
      })
      setResetMessage('パスワードを変更しました')
      setMode('login')
    } catch (submitError) {
      setFormError(formatApiError(submitError))
    }
  }

  return (
    <Box className="login-screen" as="main">
      <Box
        className="login-card"
        as="section"
        aria-label="ログイン"
        bg="rgba(255, 255, 255, 0.78)"
        border="1px solid"
        borderColor="whiteAlpha.700"
        borderRadius="32px"
        boxShadow="0 28px 80px rgba(112, 133, 182, 0.22)"
        backdropFilter="blur(22px)"
      >
        <Stack className="login-brand" direction="row" align="center" spacing="4">
          <Box
            className="brand-mark"
            bg="linear-gradient(135deg, #d8e4ff 0%, #bfeee2 100%)"
            color="brand.800"
            boxShadow="inset 0 1px 0 rgba(255,255,255,0.6)"
          >
            IP
          </Box>
          <Box>
            <Heading as="strong" size="md">iot_platform</Heading>
            <Text color="gray.500" fontSize="sm">{isResetMode ? 'password reset flow' : 'pastel admin console'}</Text>
          </Box>
        </Stack>
        {isResetMode ? (
          <Stack as="form" className="login-form" onSubmit={submitPasswordReset} spacing="4">
            {(formError || error) && <Text className="form-error">{formError || error}</Text>}
            {resetMessage && <Text className="form-success">{resetMessage}</Text>}
            <FormControl>
              <FormLabel>ログインID</FormLabel>
              <Input type="text" autoComplete="username" value={resetLoginId} onChange={(event) => setResetLoginId(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>新しいパスワード</FormLabel>
              <Input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>新しいパスワード確認</FormLabel>
              <Input type="password" autoComplete="new-password" />
            </FormControl>
            <Button type="submit" isDisabled={isSubmitting}>パスワードを変更</Button>
            <Button className="text-button" type="button" variant="ghost" onClick={() => changeMode('login')}>
              ログイン画面へ戻る
            </Button>
          </Stack>
        ) : (
          <Stack as="form" className="login-form" onSubmit={submitLogin} spacing="4">
            {(formError || error) && <Text className="form-error">{formError || error}</Text>}
            <FormControl>
              <FormLabel>ログインID</FormLabel>
              <Input type="text" autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>パスワード</FormLabel>
              <Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </FormControl>
            <Button type="submit" isDisabled={isSubmitting}>{isSubmitting ? '通信中...' : 'ログイン'}</Button>
            <Button className="text-button" type="button" variant="ghost" onClick={() => changeMode('password_reset')}>
              パスワード再発行
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  )
}
