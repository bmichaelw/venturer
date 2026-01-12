import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCard from '../components/admin/StatCard';
import MetricsChart from '../components/admin/MetricsChart';
import ActivityFeed from '../components/admin/ActivityFeed';

const createPageUrl = (pageName) => `#/${pageName}`;

export default function AdminDashboard() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['allItems'],
    queryFn: () => base44.entities.Item.list(),
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['allVentures'],
    queryFn: () => base44.entities.Venture.list(),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.UserSubscription.list(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
  });

  // Check admin access
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    );
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const mau = allUsers.filter(u => new Date(u.updated_date) >= thirtyDaysAgo).length;
    const wau = allUsers.filter(u => new Date(u.updated_date) >= sevenDaysAgo).length;
    const dau = allUsers.filter(u => new Date(u.updated_date) >= oneDayAgo).length;

    const mrr = subscriptions.reduce((sum, sub) => sum + (sub.mrr_contribution || 0), 0);
    const payingUsers = subscriptions.filter(s => s.mrr_contribution > 0).length;

    const tasksCreated = items.filter(i => new Date(i.created_date) >= thirtyDaysAgo).length;
    const tasksCompleted = items.filter(i => i.status === 'completed' && new Date(i.updated_date) >= thirtyDaysAgo).length;

    return {
      mau,
      wau,
      dau,
      totalUsers: allUsers.length,
      mrr,
      arr: mrr * 12,
      payingUsers,
      tasksCreated,
      tasksCompleted,
      totalVentures: ventures.length,
    };
  }, [allUsers, items, subscriptions, ventures]);

  // Recent activity feed
  const recentActivity = useMemo(() => {
    const events = [];
    
    // Recent signups
    allUsers.slice(-5).forEach(user => {
      events.push({
        type: 'signup',
        message: `${user.full_name || user.email} joined Venturer`,
        timestamp: user.created_date,
      });
    });

    // Recent ventures
    ventures.slice(-3).forEach(v => {
      events.push({
        type: 'venture',
        message: `New venture created: ${v.name}`,
        timestamp: v.created_date,
      });
    });

    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
  }, [allUsers, ventures]);

  // Chart data
  const chartData = useMemo(() => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayItems = items.filter(item => 
        item.created_date && item.created_date.startsWith(dateStr)
      );
      
      last30Days.push({
        date: dateStr.slice(5),
        created: dayItems.length,
        completed: dayItems.filter(i => i.status === 'completed').length,
      });
    }
    return last30Days;
  }, [items]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-[11px] font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-3">
          ADMIN DASHBOARD
        </h1>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[32px] font-medium text-[#0F172A] dark:text-white leading-tight">
              Founder Overview
            </p>
            <p className="text-[15px] text-[#64748B] dark:text-gray-400 mt-1">
              Monitor user engagement and revenue metrics
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('AdminUsers')}>
              <Button variant="outline">View Users</Button>
            </Link>
            <Link to={createPageUrl('AdminRevenue')}>
              <Button className="bg-[#3B82F6] hover:bg-[#2563EB]">Revenue</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Monthly Active Users"
          value={metrics.mau}
          subtitle={`${metrics.wau} weekly, ${metrics.dau} daily`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="MRR"
          value={`$${metrics.mrr.toLocaleString()}`}
          subtitle={`ARR: $${metrics.arr.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Paying Customers"
          value={metrics.payingUsers}
          subtitle={`${metrics.totalUsers} total users`}
          icon={TrendingUp}
          color="orange"
        />
        <StatCard
          title="Tasks (30 days)"
          value={metrics.tasksCreated}
          subtitle={`${metrics.tasksCompleted} completed`}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MetricsChart
          title="Task Activity (Last 30 Days)"
          data={chartData}
          dataKeys={[
            { key: 'created', name: 'Created' },
            { key: 'completed', name: 'Completed' },
          ]}
        />
        <ActivityFeed events={recentActivity} />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to={createPageUrl('AdminUsers')}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <Users className="w-8 h-8 text-[#3B82F6] mb-3" />
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">User Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View and manage all users</p>
          </div>
        </Link>
        <Link to={createPageUrl('AdminRevenue')}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <DollarSign className="w-8 h-8 text-[#10B981] mb-3" />
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">Revenue Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track subscriptions and MRR</p>
          </div>
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <Activity className="w-8 h-8 text-[#8B5CF6] mb-3" />
          <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">Platform Stats</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Total Ventures: {metrics.totalVentures}</p>
            <p>Total Items: {items.length}</p>
            <p>Avg per User: {(items.length / metrics.totalUsers || 0).toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}