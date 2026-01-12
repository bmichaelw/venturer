import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-stone-200/50 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Profile</h1>
        
        {user && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Name</p>
              <p className="text-lg font-semibold text-slate-900">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Email</p>
              <p className="text-lg text-slate-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Role</p>
              <p className="text-lg text-slate-900 capitalize">{user.role}</p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-stone-200">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}