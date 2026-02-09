export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'owner' | 'employee';
}

export interface Transaction {
  id: number;
  userId: number;
  serviceType: ServiceType;
  amount: number;
  transactionType: 'deposit' | 'withdraw' | 'transfer';
  cashInHand: number;
  description?: string;
  createdAt: string;
  employeeName?: string;
}

export type ServiceType = 
  | 'vodacom'
  | 'airtel'
  | 'tigo'
  | 'halotel'
  | 'lipa_namba_vodacom'
  | 'lipa_namba_airtel'
  | 'lipa_namba_tigo'
  | 'lipa_namba_halotel';

export interface ServiceInfo {
  id: ServiceType;
  name: string;
  color: string;
  textColor: string;
}

export interface DashboardData {
  services: Array<{
    service_type: ServiceType;
    cash_in_hand: number;
    created_at: string;
  }>;
  summary: {
    total_deposits: number;
    total_withdrawals: number;
    total_transactions: number;
  };
}

export interface ProfitLossData {
  date: string;
  profit: number;
}
