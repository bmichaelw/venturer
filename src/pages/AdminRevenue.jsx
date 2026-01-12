import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import StatCard from '../components/admin/StatCard';
import MetricsChart from '../components/admin/MetricsChart';

const createPageUrl = (pageName) => `#/${pageName}`;

export default function AdminRevenue() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.UserSubscription.list(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
  });

  const { data: subHistory = [] } = useQuery({
    queryKey: ['subscriptionHistory'],
    queryFn: () => base44.entities.SubscriptionHistory.list(),
  });

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    );
  }

  const metrics = useMemo(() => {
    const mrr = subscriptions.reduce((sum, sub) => 
      sub.status === 'active' ? sum + (sub.mrr_contribution || 0) : sum, 0
    );
    const arr = mrr * 12;
    const payingUsers = subscriptions.filter(s => s.mrr_contribution > 0 && s.status === 'active').length;
    const arpu = payingUsers > 0 ? mrr / payingUsers : 0;

    const planCounts = {};
    plans.forEach(plan => {
      planCounts[plan.name] = subscriptions.filter(s => s.plan_id === plan.id).length;
    });
    planCounts['Free'] = allUsers.length - subscriptions.length;

    const upgrades = subHistory.filter(h => h.event_type === 'upgrade').length;
    const downgrades = subHistory.filter(h => h.event_type === 'downgrade').length;
    const cancellations = subHistory.filter(h => h.event_type === 'cancel').length;

    return {
      mrr,
      arr,
      payingUsers,
      arpu,
      planCounts,
      upgrades,
      downgrades,
      cancellations,
    };
  }, [subscriptions, plans, allUsers, subHistory]);

  const recentEvents = useMemo(() => {
    return subHistory
      .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
      .slice(0, 20);
  }, [subHistory]);

  const getEventBadge = (type) => {
    switch (type) {
      case 'upgrade':
        return <Badge className="bg-emerald-100 text-emerald-800">Upgrade</Badge>;
      case 'downgrade':
        return <Badge className="bg-orange-100 text-orange-800">Downgrade</Badge>;
      case 'cancel':
        return <Badge className="bg-red-100 text-red-800">Cancel</Badge>;
      case 'reactivate':
        return <Badge className="bg-blue-100 text-blue-800">Reactivate</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Link to={createPageUrl('Admin')}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-[11px] font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-3">
          REVENUE ANALYTICS
        </h1>
        <p className="text-[32px] font-medium text-[#0F172A] dark:text-white leading-tight">
          Subscriptions & Revenue
        </p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="MRR"
          value={`$${metrics.mrr.toLocaleString()}`}
          subtitle="Monthly recurring revenue"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="ARR"
          value={`$${metrics.arr.toLocaleString()}`}
          subtitle="Annual recurring revenue"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Paying Customers"
          value={metrics.payingUsers}
          subtitle={`${allUsers.length} total users`}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="ARPU"
          value={`$${metrics.arpu.toFixed(2)}`}
          subtitle="Average revenue per user"
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Plan Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-6">Plan Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(metrics.planCounts).map(([planName, count]) => {
            const percentage = ((count / allUsers.length) * 100).toFixed(1);
            return (
              <div key={planName} className="text-center">
                <div className="text-4xl font-bold text-[#0F172A] dark:text-white mb-2">{count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{planName} Plan</div>
                <div className="text-xs text-gray-500">{percentage}% of users</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">Upgrades</h3>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{metrics.upgrades}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">Downgrades</h3>
          </div>
          <div className="text-3xl font-bold text-orange-600">{metrics.downgrades}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white">Cancellations</h3>
          </div>
          <div className="text-3xl font-bold text-red-600">{metrics.cancellations}</div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white">Recent Subscription Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MRR Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No subscription events yet
                  </td>
                </tr>
              ) : (
                recentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(event.event_date || event.created_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#0F172A] dark:text-white">
                      {event.user_email}
                    </td>
                    <td className="px-6 py-4">{getEventBadge(event.event_type)}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <span className={event.mrr_change >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {event.mrr_change >= 0 ? '+' : ''}${event.mrr_change}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}