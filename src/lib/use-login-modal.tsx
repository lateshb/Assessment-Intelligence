"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import LoginModal from "@/components/LoginModal";

interface LoginModalContextType {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType>({
  isLoginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
});

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  return (
    <LoginModalContext.Provider
      value={{ isLoginModalOpen, openLoginModal, closeLoginModal }}
    >
      {children}
      {isLoginModalOpen && <LoginModal onClose={closeLoginModal} />}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  return useContext(LoginModalContext);
}
