import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { userStorage, generateId, isValidEmail } from '../utils/storage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carrega usuário do localStorage na inicialização
    const savedUser = userStorage.get();
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!isValidEmail(email) || password.length < 6) {
      return false;
    }

    // Simulação de autenticação - em uma aplicação real, isso seria uma chamada para API
    // Por simplicidade, qualquer email/senha válidos permitem login
    const userData: User = {
      id: generateId(),
      email,
      name: email.split('@')[0], // Usa parte antes do @ como nome
      createdAt: new Date().toISOString()
    };

    userStorage.set(userData);
    setUser(userData);
    return true;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    if (!isValidEmail(email) || password.length < 6 || name.trim().length < 2) {
      return false;
    }

    // Simulação de registro - em uma aplicação real, isso seria uma chamada para API
    const userData: User = {
      id: generateId(),
      email,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };

    userStorage.set(userData);
    setUser(userData);
    return true;
  };

  const logout = () => {
    userStorage.remove();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}