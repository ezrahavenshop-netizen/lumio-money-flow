import React, { createContext, useContext, useState, useCallback } from "react";

export interface Transaction {
  id: string;
  date: string;
  type: "credit" | "debit";
  amount: number;
  status: "successful" | "pending" | "failed";
  reference: string;
  category: string;
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
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
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

const defaultUser: UserData = {
  firstName: "Kyu",
  lastName: "Min Lee",
  fullName: "Kyu Min Lee",
  initials: "KM",
  avatarUrl: null,
  dateOfBirth: "1986",
  gender: "Male",
  maritalStatus: "Single",
  occupation: "Director of Operations",
  address: "Chelmsford, United Kingdom",
  phone: "+447587112749",
  email: "Kyuminlee@hotmail.com",
  accountNumber: "4024 8812 7743 4821",
  accountNumberMasked: "**** **** **** 4821",
  accountType: "Lumio Premier",
  memberSince: "March 2019",
  kycVerified: true,
};

const defaultTransactions: Transaction[] = [
  { id: "TXN001", date: "2019-03-15T10:00:00", type: "credit", amount: 5000, status: "successful", reference: "LUM-OPEN2019", category: "income" },
  { id: "TXN002", date: "2019-04-02T09:30:00", type: "credit", amount: 8200, status: "successful", reference: "SAL-APR2019", category: "income" },
  { id: "TXN003", date: "2019-05-18T14:15:00", type: "debit", amount: 3500, status: "successful", reference: "LUM-TRF0012", category: "transfer" },
  { id: "TXN004", date: "2019-07-22T11:45:00", type: "debit", amount: 12400, status: "successful", reference: "LUM-TRF0021", category: "transfer" },
  { id: "TXN005", date: "2019-09-05T16:20:00", type: "credit", amount: 47000, status: "successful", reference: "INV-Q32019", category: "income" },
  { id: "TXN006", date: "2019-10-14T09:00:00", type: "debit", amount: 750, status: "successful", reference: "LUM-TRF0033", category: "transfer" },
  { id: "TXN007", date: "2019-11-28T13:30:00", type: "debit", amount: 210000, status: "successful", reference: "LUM-PROP001", category: "housing" },
  { id: "TXN008", date: "2019-12-20T10:45:00", type: "credit", amount: 25000, status: "successful", reference: "BON-DEC2019", category: "income" },
  { id: "TXN009", date: "2020-01-10T08:30:00", type: "debit", amount: 4800, status: "successful", reference: "LUM-TRF0044", category: "transfer" },
  { id: "TXN010", date: "2020-03-19T15:00:00", type: "debit", amount: 18500, status: "successful", reference: "LUM-TRF0051", category: "transfer" },
  { id: "TXN011", date: "2020-05-07T11:20:00", type: "credit", amount: 8200, status: "successful", reference: "SAL-MAY2020", category: "income" },
  { id: "TXN012", date: "2020-07-14T14:00:00", type: "debit", amount: 9200, status: "successful", reference: "LUM-TRF0062", category: "transfer" },
  { id: "TXN013", date: "2020-09-30T09:45:00", type: "credit", amount: 63000, status: "successful", reference: "INV-Q32020", category: "income" },
  { id: "TXN014", date: "2020-11-11T10:30:00", type: "debit", amount: 32000, status: "successful", reference: "LUM-TRF0077", category: "transfer" },
  { id: "TXN015", date: "2020-12-18T16:00:00", type: "credit", amount: 30000, status: "successful", reference: "BON-DEC2020", category: "income" },
  { id: "TXN016", date: "2021-02-03T09:15:00", type: "debit", amount: 1500, status: "successful", reference: "LUM-TRF0083", category: "transfer" },
  { id: "TXN017", date: "2021-04-22T13:00:00", type: "debit", amount: 56000, status: "successful", reference: "LUM-TRF0091", category: "transfer" },
  { id: "TXN018", date: "2021-06-15T10:00:00", type: "credit", amount: 9500, status: "successful", reference: "SAL-JUN2021", category: "income" },
  { id: "TXN019", date: "2021-08-09T14:30:00", type: "debit", amount: 2750, status: "successful", reference: "LUM-TRF0104", category: "transfer" },
  { id: "TXN020", date: "2021-09-27T11:45:00", type: "credit", amount: 88000, status: "successful", reference: "INV-Q32021", category: "income" },
  { id: "TXN021", date: "2021-11-03T09:30:00", type: "debit", amount: 6400, status: "successful", reference: "LUM-TRF0115", category: "transfer" },
  { id: "TXN022", date: "2021-12-22T15:00:00", type: "credit", amount: 35000, status: "successful", reference: "BON-DEC2021", category: "income" },
  { id: "TXN023", date: "2022-01-17T10:00:00", type: "debit", amount: 3100, status: "successful", reference: "LUM-TRF0121", category: "transfer" },
  { id: "TXN024", date: "2022-03-08T13:30:00", type: "debit", amount: 145000, status: "successful", reference: "LUM-TRF0132", category: "transfer" },
  { id: "TXN025", date: "2022-05-19T09:00:00", type: "credit", amount: 9500, status: "successful", reference: "SAL-MAY2022", category: "income" },
  { id: "TXN026", date: "2022-07-04T14:15:00", type: "debit", amount: 750, status: "successful", reference: "LUM-TRF0143", category: "transfer" },
  { id: "TXN027", date: "2022-08-30T11:00:00", type: "credit", amount: 112000, status: "successful", reference: "INV-Q32022", category: "income" },
  { id: "TXN028", date: "2022-10-12T10:30:00", type: "debit", amount: 78000, status: "successful", reference: "LUM-TRF0157", category: "transfer" },
  { id: "TXN029", date: "2022-12-05T16:45:00", type: "credit", amount: 40000, status: "successful", reference: "BON-DEC2022", category: "income" },
  { id: "TXN030", date: "2023-01-25T09:00:00", type: "debit", amount: 5500, status: "successful", reference: "LUM-TRF0163", category: "transfer" },
  { id: "TXN031", date: "2023-03-14T13:15:00", type: "debit", amount: 1200, status: "successful", reference: "LUM-TRF0174", category: "transfer" },
  { id: "TXN032", date: "2023-05-02T10:30:00", type: "credit", amount: 11000, status: "successful", reference: "SAL-MAY2023", category: "income" },
  { id: "TXN033", date: "2023-06-20T14:00:00", type: "debit", amount: 95000, status: "successful", reference: "LUM-TRF0188", category: "transfer" },
  { id: "TXN034", date: "2023-08-08T11:30:00", type: "credit", amount: 130000, status: "successful", reference: "INV-Q32023", category: "income" },
  { id: "TXN035", date: "2023-09-19T09:45:00", type: "debit", amount: 4300, status: "successful", reference: "LUM-TRF0195", category: "transfer" },
  { id: "TXN036", date: "2023-11-07T15:30:00", type: "debit", amount: 175000, status: "successful", reference: "LUM-TRF0207", category: "transfer" },
  { id: "TXN037", date: "2023-12-19T10:00:00", type: "credit", amount: 50000, status: "successful", reference: "BON-DEC2023", category: "income" },
  { id: "TXN038", date: "2024-02-14T09:30:00", type: "debit", amount: 8800, status: "successful", reference: "LUM-TRF0213", category: "transfer" },
  { id: "TXN039", date: "2024-04-03T13:00:00", type: "debit", amount: 62000, status: "successful", reference: "LUM-TRF0224", category: "transfer" },
  { id: "TXN040", date: "2024-05-22T10:15:00", type: "credit", amount: 11000, status: "successful", reference: "SAL-MAY2024", category: "income" },
  { id: "TXN041", date: "2024-07-11T14:45:00", type: "credit", amount: 158000, status: "successful", reference: "INV-Q22024", category: "income" },
  { id: "TXN042", date: "2024-08-29T11:00:00", type: "debit", amount: 2100, status: "successful", reference: "LUM-TRF0238", category: "transfer" },
  { id: "TXN043", date: "2024-10-07T09:30:00", type: "debit", amount: 210000, status: "successful", reference: "LUM-TRF0249", category: "transfer" },
  { id: "TXN044", date: "2024-12-16T15:00:00", type: "credit", amount: 60000, status: "successful", reference: "BON-DEC2024", category: "income" },
  { id: "TXN045", date: "2025-02-11T10:30:00", type: "debit", amount: 14500, status: "successful", reference: "LUM-TRF0255", category: "transfer" },
  { id: "TXN046", date: "2025-11-03T14:00:00", type: "debit", amount: 37200, status: "successful", reference: "LUM-TRF0261", category: "transfer" },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData>(defaultUser);
  const [balance, setBalance] = useState(3750000);
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, text: "Your March salary has been credited", read: false },
    { id: 2, text: "Your last transfer was successful", read: false },
  ]);

  const addTransaction = useCallback((t: Transaction) => {
    setTransactions((prev) => [t, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <AppContext.Provider
      value={{
        user, setUser, balance, setBalance, transactions, addTransaction,
        isLoggedIn, setIsLoggedIn, isAdmin, setIsAdmin,
        adminUnreadCount, setAdminUnreadCount,
        notifications, markAllRead, currency: "£"
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
