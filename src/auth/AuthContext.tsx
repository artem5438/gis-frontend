import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { currentAccount, loginAccount, logoutAccount, registerAccount, type Account } from './api'

type AuthValue = {
  account: Account | null
  ready: boolean
  register: (fullName: string, login: string, password: string) => Promise<void>
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    currentAccount()
      .then((next) => {
        if (alive) setAccount(next)
      })
      .catch(() => {
        if (alive) setAccount(null)
      })
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [])

  const value: AuthValue = {
    account,
    ready,
    async register(fullName, login, password) {
      setAccount(await registerAccount(fullName, login, password))
    },
    async login(login, password) {
      setAccount(await loginAccount(login, password))
    },
    async logout() {
      await logoutAccount()
      setAccount(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth используется внутри AuthProvider')
  return value
}
