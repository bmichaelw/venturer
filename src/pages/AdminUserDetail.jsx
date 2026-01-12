import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import StatCard from '../components/admin/StatCard';
import MetricsChart from '../components/admin/MetricsChart';

const createPageUrl = (pageName) => `#/${pageName}`;

export default function AdminUserDetail() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const userEmail = urlParams.get('email');

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

  const { data: items = [] } = useQuery({
    queryKey: ['allItems'],
    queryFn: () => base44.entities.Item.list(),
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['allVentures'],
    queryFn: () => base44.entities.Venture.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list(),
  });

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    );
  }

  const user = allUsers.find(u => u.email === userEmail);
  const userSub = subscriptions.find(s => s.user_email === userEmail);
  const plan = userSub ? plans.find(p => p.id === userSub.plan_id) : null;

  const userMetrics = useMemo(() => {
    if (!user) return null;

    const userItems = items.filter(i => i.created_by === user.email);
    const userVentures = ventures.filter(v => v.created_by === user.email);
    const userProjects = projects.filter(p => p.created_by === user.email);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentItems = userItems.filter(i => new Date(i.created_date) >= thirtyDaysAgo);
    const completedItems = userItems.filter(i => i.status === 'completed');
    const recentCompleted = completedItems.filter(i => new Date(i.updated_date) >= thirtyDaysAgo);

    const completionRate = userItems.length > 0 
      ? Math.round((completedItems.length / userItems.length) * 100)
      : 0;

    // Activity chart data
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayItems = userItems.filter(item => 
        item.created_date && item.created_date.startsWith(dateStr)
      );
      
      last30Days.push({
        date: dateStr.slice(5),
        created: dayItems.length,
        completed: dayItems.filter(i => i.status === 'completed').length,
      });
    }

    return {
      totalTasks: userItems.length,
      tasksCreated30d: recentItems.length,
      tasksCompleted30d: recentCompleted.length,
      completionRate,
      totalVentures: userVentures.length,
      totalProjects: userProjects.length,
      chartData: last30Days,
    };
  }, [user, items, ventures, projects]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
        <Link to={createPageUrl('AdminUsers')}>
          <Button>Back to Users</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Link to={createPageUrl('AdminUsers')}>
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
      </Link>

      {/* User Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-3xl font-semibold">
              {(user.full_name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-[#0F172A] dark:text-white mb-2">
                {user.full_name || user.email}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Joined {format(new Date(user.created_date), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="mt-3">
                <Badge className={plan?.name === 'Pro' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                  {plan?.name || 'Free'} Plan
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Details */}
      {userSub && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-4">Subscription Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
              <Badge className="bg-emerald-100 text-emerald-800">{userSub.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Billing Cycle</p>
              <p className="text-[#0F172A] dark:text-white font-medium">{userSub.billing_cycle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">MRR Contribution</p>
              <p className="text-[#0F172A] dark:text-white font-semibold text-lg">${userSub.mrr_contribution}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {userMetrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Tasks"
              value={userMetrics.totalTasks}
              subtitle="All time"
              color="blue"
            />
            <StatCard
              title="Tasks (30 days)"
              value={userMetrics.tasksCreated30d}
              subtitle={`${userMetrics.tasksCompleted30d} completed`}
              color="green"
            />
            <StatCard
              title="Completion Rate"
              value={`${userMetrics.completionRate}%`}
              color="orange"
            />
            <StatCard
              title="Ventures"
              value={userMetrics.totalVentures}
              subtitle={`${userMetrics.totalProjects} projects`}
              color="purple"
            />
          </div>

          {/* Activity Chart */}
          <MetricsChart
            title="Activity (Last 30 Days)"
            data={userMetrics.chartData}
            dataKeys={[
              { key: 'created', name: 'Tasks Created' },
              { key: 'completed', name: 'Tasks Completed' },
            ]}
          />
        </>
      )}
    </div>
  );
}