import React from 'react';
import './ServiceCard.css';

interface ServiceCardProps {
  name: string;
  lineCard: string;
  color: string;
  textColor: string;
  amount: number;
  onClick?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  name, 
  lineCard,
  color, 
  textColor, 
  amount,
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
        <p className="line-card-meta">Line/Card: {lineCard}</p>
      </div>
      <div className="service-card-body">
        <p className="label">Entered Amount</p>
        <p className="amount">{formatCurrency(amount)}</p>
      </div>
    </div>
  );
};

export default ServiceCard;
