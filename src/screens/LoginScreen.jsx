import { useState } from 'react'
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
    <main className="login-screen">
      <section className="login-card" aria-label="ログイン">
        <div className="login-brand">
          <div className="brand-mark">IP</div>
          <div>
            <strong>iot_platform</strong>
            <span>{isResetMode ? 'password reset flow' : 'simple admin console'}</span>
          </div>
        </div>
        {isResetMode ? (
          <form className="login-form" onSubmit={submitPasswordReset}>
            {(formError || error) && <p className="form-error">{formError || error}</p>}
            {resetMessage && <p className="form-success">{resetMessage}</p>}
            <label>
              <span>ログインID</span>
              <input type="text" autoComplete="username" value={resetLoginId} onChange={(event) => setResetLoginId(event.target.value)} />
            </label>
            <label>
              <span>新しいパスワード</span>
              <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
            <label>
              <span>新しいパスワード確認</span>
              <input type="password" autoComplete="new-password" />
            </label>
            <button type="submit" disabled={isSubmitting}>パスワードを変更</button>
            <button className="text-button" type="button" onClick={() => changeMode('login')}>
              ログイン画面へ戻る
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={submitLogin}>
            {(formError || error) && <p className="form-error">{formError || error}</p>}
            <label>
              <span>ログインID</span>
              <input type="text" autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} />
            </label>
            <label>
              <span>パスワード</span>
              <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? '通信中...' : 'ログイン'}</button>
            <button className="text-button" type="button" onClick={() => changeMode('password_reset')}>
              パスワード再発行
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
