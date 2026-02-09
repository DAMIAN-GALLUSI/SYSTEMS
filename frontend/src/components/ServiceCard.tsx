import React from 'react';
import './ServiceCard.css';

interface ServiceCardProps {
  name: string;
  color: string;
  textColor: string;
  cashInHand: number;
  onClick?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  name, 
  color, 
  textColor, 
  cashInHand,
  onClick 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div 
      className="service-card" 
      style={{ backgroundColor: color, color: textColor }}
      onClick={onClick}
    >
      <div className="service-card-header">
        <h3>{name}</h3>
      </div>
      <div className="service-card-body">
        <p className="label">Cash in Hand</p>
        <p className="amount">{formatCurrency(cashInHand)}</p>
      </div>
    </div>
  );
};

export default ServiceCard;
