import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [newSkill, setNewSkill] = useState('');
  const [newExpertise, setNewExpertise] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', currentUser?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({
        user_email: currentUser.email
      });
      return profiles[0] || null;
    },
    enabled: !!currentUser,
  });

  const createOrUpdateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (userProfile) {
        return base44.entities.UserProfile.update(userProfile.id, data);
      } else {
        return base44.entities.UserProfile.create({
          user_email: currentUser.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
      toast.success('Profile updated');
    },
  });

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const currentSkills = userProfile?.skills || [];
    if (currentSkills.includes(newSkill.trim())) {
      toast.error('Skill already added');
      return;
    }
    createOrUpdateProfileMutation.mutate({
      skills: [...currentSkills, newSkill.trim()],
      expertise_areas: userProfile?.expertise_areas || []
    });
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    const currentSkills = userProfile?.skills || [];
    createOrUpdateProfileMutation.mutate({
      skills: currentSkills.filter(s => s !== skill),
      expertise_areas: userProfile?.expertise_areas || []
    });
  };

  const addExpertise = () => {
    if (!newExpertise.trim()) return;
    const currentExpertise = userProfile?.expertise_areas || [];
    if (currentExpertise.includes(newExpertise.trim())) {
      toast.error('Expertise already added');
      return;
    }
    createOrUpdateProfileMutation.mutate({
      skills: userProfile?.skills || [],
      expertise_areas: [...currentExpertise, newExpertise.trim()]
    });
    setNewExpertise('');
  };

  const removeExpertise = (expertise) => {
    const currentExpertise = userProfile?.expertise_areas || [];
    createOrUpdateProfileMutation.mutate({
      skills: userProfile?.skills || [],
      expertise_areas: currentExpertise.filter(e => e !== expertise)
    });
  };

  if (!currentUser) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xs font-semibold text-[#4B5563] uppercase tracking-widest mb-2">PROFILE</h1>
        <p className="text-2xl font-semibold text-[#101827]">Manage your skills for AI-powered task delegation</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-6">
        {/* User Info */}
        <div className="pb-6 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#101827] mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-[#4B5563]">Name</Label>
              <p className="text-[#101827] font-medium">{currentUser.full_name}</p>
            </div>
            <div>
              <Label className="text-sm text-[#4B5563]">Email</Label>
              <p className="text-[#101827]">{currentUser.email}</p>
            </div>
            <div>
              <Label className="text-sm text-[#4B5563]">Role</Label>
              <Badge className="bg-[#14B8A6] text-white">{currentUser.role}</Badge>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="pb-6 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#101827] mb-2">Skills</h2>
          <p className="text-sm text-[#4B5563] mb-4">
            Add your skills to help AI suggest better task assignments
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {(userProfile?.skills || []).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="pr-1 border-[#14B8A6] text-[#14B8A6]"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 hover:bg-[#14B8A6]/10 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {(userProfile?.skills || []).length === 0 && (
              <p className="text-sm text-[#4B5563] italic">No skills added yet</p>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="e.g., JavaScript, Marketing, Design"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="flex-1"
            />
            <Button
              onClick={addSkill}
              disabled={!newSkill.trim()}
              className="bg-[#14B8A6] hover:bg-[#0d9488]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Expertise Areas */}
        <div>
          <h2 className="text-lg font-semibold text-[#101827] mb-2">Expertise Areas</h2>
          <p className="text-sm text-[#4B5563] mb-4">
            Your areas of deep knowledge and experience
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {(userProfile?.expertise_areas || []).map((expertise) => (
              <Badge
                key={expertise}
                variant="outline"
                className="pr-1 border-[#F59E0B] text-[#F59E0B]"
              >
                {expertise}
                <button
                  onClick={() => removeExpertise(expertise)}
                  className="ml-2 hover:bg-[#F59E0B]/10 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {(userProfile?.expertise_areas || []).length === 0 && (
              <p className="text-sm text-[#4B5563] italic">No expertise areas added yet</p>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={newExpertise}
              onChange={(e) => setNewExpertise(e.target.value)}
              placeholder="e.g., E-commerce, Data Analysis, UX Research"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
              className="flex-1"
            />
            <Button
              onClick={addExpertise}
              disabled={!newExpertise.trim()}
              className="bg-[#14B8A6] hover:bg-[#0d9488]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}