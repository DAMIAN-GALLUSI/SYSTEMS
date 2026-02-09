import { ServiceType, ServiceInfo } from '../types';

export const SERVICES: ServiceInfo[] = [
  {
    id: 'vodacom',
    name: 'Vodacom',
    color: '#E60000',
    textColor: '#FFFFFF'
  },
  {
    id: 'airtel',
    name: 'Airtel',
    color: '#E30613',
    textColor: '#FFFFFF'
  },
  {
    id: 'tigo',
    name: 'Tigo',
    color: '#0066CC',
    textColor: '#FFFFFF'
  },
  {
    id: 'halotel',
    name: 'Halotel',
    color: '#FF6B00',
    textColor: '#FFFFFF'
  },
  {
    id: 'lipa_namba_vodacom',
    name: 'Lipa Namba Vodacom',
    color: '#E60000',
    textColor: '#FFFFFF'
  },
  {
    id: 'lipa_namba_airtel',
    name: 'Lipa Namba Airtel',
    color: '#E30613',
    textColor: '#FFFFFF'
  },
  {
    id: 'lipa_namba_tigo',
    name: 'Lipa Namba Tigo',
    color: '#0066CC',
    textColor: '#FFFFFF'
  },
  {
    id: 'lipa_namba_halotel',
    name: 'Lipa Namba Halotel',
    color: '#FF6B00',
    textColor: '#FFFFFF'
  }
];

export const getServiceInfo = (serviceType: ServiceType): ServiceInfo => {
  return SERVICES.find(s => s.id === serviceType) || SERVICES[0];
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
