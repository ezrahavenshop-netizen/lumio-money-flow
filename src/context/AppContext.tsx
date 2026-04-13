import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

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

function ssGet<T>(key: string, fallback: T): T {
  try {
    const v = sessionStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function ssSet(key: string, value: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function ssDel(key: string) {
  try { sessionStorage.removeItem(key); } catch {}
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserRaw] = useState<UserData>(() => ssGet("lumio_user", emptyUser));
  const [userId, setUserIdRaw] = useState<string | null>(() => ssGet("lumio_userId", null));
  const [userStatus, setUserStatusRaw] = useState<string>(() => ssGet("lumio_userStatus", "active"));
  const [transferPin, setTransferPinRaw] = useState<string>(() => ssGet("lumio_transferPin", ""));
  const [balance, setBalanceRaw] = useState<number>(() => ssGet("lumio_balance", 0));
  const [isLoggedIn, setIsLoggedInRaw] = useState<boolean>(() => ssGet("lumio_isLoggedIn", false));
  const [isAdmin, setIsAdminRaw] = useState<boolean>(() => ssGet("lumio_isAdmin", false));
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Persist helpers
  const setUser: React.Dispatch<React.SetStateAction<UserData>> = (v) => {
    setUserRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      ssSet("lumio_user", next);
      return next;
    });
  };
  const setUserId: React.Dispatch<React.SetStateAction<string | null>> = (v) => {
    setUserIdRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      ssSet("lumio_userId", next);
      return next;
    });
  };
  const setUserStatus: React.Dispatch<React.SetStateAction<string>> = (v) => {
    setUserStatusRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      ssSet("lumio_userStatus", next);
      return next;
    });
  };
  const setTransferPin: React.Dispatch<React.SetStateAction<string>> = (v) => {
    setTransferPinRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      ssSet("lumio_transferPin", next);
      return next;
    });
  };
  const setBalance: React.Dispatch<React.SetStateAction<number>> = (v) => {
    setBalanceRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      ssSet("lumio_balance", next);
      return next;
    });
  };
  const setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>> = (v) => {
    setIsLoggedInRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      ssSet("lumio_isLoggedIn", next);
      if (!next) {
        // Clear all user session data on logout
        ssDel("lumio_user");
        ssDel("lumio_userId");
        ssDel("lumio_userStatus");
        ssDel("lumio_transferPin");
        ssDel("lumio_balance");
        ssDel("lumio_isLoggedIn");
      }
      return next;
    });
  };
  const setIsAdmin: React.Dispatch<React.SetStateAction<boolean>> = (v) => {
    setIsAdminRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      ssSet("lumio_isAdmin", next);
      if (!next) ssDel("lumio_isAdmin");
      return next;
    });
  };

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
