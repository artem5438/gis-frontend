import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import {
  currentAccount,
  loginAccount,
  logoutAccount,
  myApplication,
  registerAccount,
  sendApplication,
  type Account,
  type RoleRequest,
} from './api'

type AuthValue = {
  account: Account | null
  request: RoleRequest | null
  ready: boolean
  register: (fullName: string, login: string, password: string) => Promise<void>
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  apply: (text: string) => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [account, setAccount] = useState<Account | null>(null)
  const [request, setRequest] = useState<RoleRequest | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    currentAccount()
      .then(async (next) => {
        if (!alive) return
        setAccount(next)
        setRequest(next ? await myApplication() : null)
      })
      .catch(() => {
        if (!alive) return
        setAccount(null)
        setRequest(null)
      })
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [location.pathname])

  const value: AuthValue = {
    account,
    request,
    ready,
    async register(fullName, login, password) {
      setAccount(await registerAccount(fullName, login, password))
      setRequest(null)
    },
    async login(login, password) {
      const next = await loginAccount(login, password)
      setAccount(next)
      setRequest(await myApplication())
    },
    async logout() {
      await logoutAccount()
      setAccount(null)
      setRequest(null)
    },
    async apply(text) {
      setRequest(await sendApplication(text))
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth используется внутри AuthProvider')
  return value
}
