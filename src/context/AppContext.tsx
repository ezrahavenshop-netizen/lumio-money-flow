import React, { createContext, useContext, useState, useCallback } from "react";

export interface Transaction {
  id: string;
  date: string;
  type: "credit" | "debit";
  amount: number;
  status: "successful" | "pending" | "failed";
  reference: string;
  category: string;
  narration?: string;
}

export interface UserData {
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  avatarUrl: string | null;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  occupation: string;
  address: string;
  phone: string;
  email: string;
  accountNumber: string;
  accountNumberMasked: string;
  accountType: string;
  memberSince: string;
  kycVerified: boolean;
}

interface Notification {
  id: number;
  text: string;
  read: boolean;
}

interface AppContextType {
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
  userId: string | null;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
  userStatus: string;
  setUserStatus: React.Dispatch<React.SetStateAction<string>>;
  transferPin: string;
  setTransferPin: React.Dispatch<React.SetStateAction<string>>;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isAdmin: boolean;
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  adminUnreadCount: number;
  setAdminUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  notifications: Notification[];
  markAllRead: () => void;
  currency: string;
}

const emptyUser: UserData = {
  firstName: "",
  lastName: "",
  fullName: "",
  initials: "",
  avatarUrl: null,
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  occupation: "",
  address: "",
  phone: "",
  email: "",
  accountNumber: "",
  accountNumberMasked: "",
  accountType: "Lumio Premier",
  memberSince: "",
  kycVerified: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData>(emptyUser);
  const [userId, setUserId] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string>("active");
  const [transferPin, setTransferPin] = useState<string>("");
  const [balance, setBalance] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <AppContext.Provider
      value={{
        user, setUser,
        userId, setUserId,
        userStatus, setUserStatus,
        transferPin, setTransferPin,
        balance, setBalance,
        isLoggedIn, setIsLoggedIn,
        isAdmin, setIsAdmin,
        adminUnreadCount, setAdminUnreadCount,
        notifications, markAllRead,
        currency: "£",
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
