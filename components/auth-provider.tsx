"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  username: string
  isAdmin: boolean
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default users with some admins
const DEFAULT_USERS = [
  { id: "1", username: "admin", password: "admin123", isAdmin: true },
  { id: "2", username: "sarah", password: "sarah123", isAdmin: true },
  { id: "3", username: "alex", password: "alex123", isAdmin: true },
  { id: "4", username: "user", password: "user123", isAdmin: false },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize default users if not exists
    const existingUsers = localStorage.getItem("app-users")
    if (!existingUsers) {
      localStorage.setItem("app-users", JSON.stringify(DEFAULT_USERS))
    }

    // Load current user from localStorage
    const savedUser = localStorage.getItem("current-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem("app-users") || "[]")
    const foundUser = users.find((u: any) => u.username === username && u.password === password)

    if (foundUser) {
      const userSession = {
        id: foundUser.id,
        username: foundUser.username,
        isAdmin: foundUser.isAdmin,
        avatar: `/placeholder.svg?height=40&width=40`,
      }
      setUser(userSession)
      localStorage.setItem("current-user", JSON.stringify(userSession))
      return true
    }
    return false
  }

  const register = async (username: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem("app-users") || "[]")

    // Check if username already exists
    if (users.find((u: any) => u.username === username)) {
      return false
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      isAdmin: false,
    }

    users.push(newUser)
    localStorage.setItem("app-users", JSON.stringify(users))

    // Auto login after registration
    const userSession = {
      id: newUser.id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
      avatar: `/placeholder.svg?height=40&width=40`,
    }
    setUser(userSession)
    localStorage.setItem("current-user", JSON.stringify(userSession))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("current-user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
