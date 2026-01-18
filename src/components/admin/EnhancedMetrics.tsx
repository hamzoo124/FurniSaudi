// src/components/admin/EnhancedMetrics.tsx (NEW FILE)
import React from 'react';
import { 
  DollarSign, 
  Users, 
  Package, 
  ShoppingBag,
  TrendingUp,
  BarChart3,
  CreditCard,
  Star,
  MessageCircle,
  Tag,
  Shield
} from 'lucide-react';

interface EnhancedMetricsProps {
  metrics: any;
  onMetricClick?: (metric: string) => void;
}

const EnhancedMetrics: React.FC<EnhancedMetricsProps> = ({ metrics, onMetricClick }) => {
  const metricCards = [
    {
      title: 'Total Revenue',
      value: `$${metrics?.totalRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      trend: '+12.5%',
      color: 'bg-green-50 text-green-700 border-green-200',
      onClick: () => onMetricClick?.('revenue')
    },
    {
      title: 'Total Orders',
      value: metrics?.totalOrders?.toLocaleString() || '0',
      icon: ShoppingBag,
      trend: '+8.2%',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      onClick: () => onMetricClick?.('orders')
    },
    {
      title: 'Total Users',
      value: metrics?.totalUsers?.toLocaleString() || '0',
      icon: Users,
      trend: '+5.3%',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      onClick: () => onMetricClick?.('users')
    },
    {
      title: 'Total Products',
      value: metrics?.totalProducts?.toLocaleString() || '0',
      icon: Package,
      trend: '+15.7%',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      onClick: () => onMetricClick?.('products')
    },
    {
      title: 'Active Sellers',
      value: metrics?.activeSellers?.toLocaleString() || '0',
      icon: Users,
      subtitle: `${metrics?.pendingApprovals || 0} pending`,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      onClick: () => onMetricClick?.('sellers')
    },
    {
      title: 'Commission Earned',
      value: `$${metrics?.commissionEarned?.toLocaleString() || '0'}`,
      icon: CreditCard,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      onClick: () => onMetricClick?.('commission')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricCards.map((card, index) => (
        <div
          key={index}
          onClick={card.onClick}
          className={`bg-white border rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow ${card.color}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-white">
              <card.icon className="w-5 h-5" />
            </div>
            {card.trend && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white">
                {card.trend}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm font-medium">{card.title}</p>
            {card.subtitle && (
              <p className="text-xs opacity-75">{card.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EnhancedMetrics;