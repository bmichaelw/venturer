import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const createPageUrl = (pageName, params = '') => `#/${pageName}${params}`;

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

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

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    );
  }

  const usersWithMetrics = useMemo(() => {
    return allUsers.map(user => {
      const userSub = subscriptions.find(s => s.user_email === user.email);
      const plan = userSub ? plans.find(p => p.id === userSub.plan_id) : null;
      const userItems = items.filter(i => i.created_by === user.email);
      
      return {
        ...user,
        plan: plan?.name || 'Free',
        mrr: userSub?.mrr_contribution || 0,
        taskCount: userItems.length,
        lastActive: user.updated_date,
      };
    });
  }, [allUsers, subscriptions, plans, items]);

  const filteredUsers = useMemo(() => {
    let filtered = [...usersWithMetrics];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter(u => u.plan === planFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || a.email).localeCompare(b.full_name || b.email);
        case 'lastActive':
          return new Date(b.lastActive) - new Date(a.lastActive);
        case 'tasks':
          return b.taskCount - a.taskCount;
        case 'mrr':
          return b.mrr - a.mrr;
        default:
          return 0;
      }
    });

    return filtered;
  }, [usersWithMetrics, searchQuery, planFilter, sortBy]);

  const getPlanBadge = (plan) => {
    const colors = {
      'Free': 'bg-gray-100 text-gray-800',
      'Pro': 'bg-blue-100 text-blue-800',
      'Business': 'bg-purple-100 text-purple-800',
    };
    return colors[plan] || colors['Free'];
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
          USER MANAGEMENT
        </h1>
        <p className="text-[32px] font-medium text-[#0F172A] dark:text-white leading-tight mb-2">
          All Users
        </p>
        <p className="text-[15px] text-[#64748B] dark:text-gray-400">
          {filteredUsers.length} users
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="Free">Free</SelectItem>
            <SelectItem value="Pro">Pro</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="lastActive">Last Active</SelectItem>
            <SelectItem value="tasks">Task Count</SelectItem>
            <SelectItem value="mrr">MRR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MRR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => window.location.href = createPageUrl('AdminUserDetail', `?email=${encodeURIComponent(user.email)}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-semibold">
                        {(user.full_name || user.email)[0].toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-[#0F172A] dark:text-white">
                          {user.full_name || user.email}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getPlanBadge(user.plan)}>{user.plan}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(user.lastActive), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {user.taskCount}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    ${user.mrr}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}