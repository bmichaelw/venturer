import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Briefcase, FolderOpen } from 'lucide-react';
import VentureCard from '../components/ventures/VentureCard';
import VentureModal from '../components/ventures/VentureModal';

export default function VenturesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingVenture, setEditingVenture] = useState(null);
  const queryClient = useQueryClient();

  // Fetch ventures
  const { data: ventures = [], isLoading } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({}, 'name'),
  });

  // Fetch item counts per venture
  const { data: itemCounts = {} } = useQuery({
    queryKey: ['venture-item-counts'],
    queryFn: async () => {
      const items = await base44.entities.Item.list();
      const counts = {};
      items.forEach((item) => {
        if (item.venture_id) {
          counts[item.venture_id] = (counts[item.venture_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Fetch project counts per venture
  const { data: projectCounts = {} } = useQuery({
    queryKey: ['venture-project-counts'],
    queryFn: async () => {
      const projects = await base44.entities.Project.list();
      const counts = {};
      projects.forEach((project) => {
        if (project.venture_id) {
          counts[project.venture_id] = (counts[project.venture_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const handleCreateNew = () => {
    setEditingVenture(null);
    setShowModal(true);
  };

  const handleEdit = (venture) => {
    setEditingVenture(venture);
    setShowModal(true);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-[#323232] mb-2 tracking-tight" style={{fontFamily: 'Acherus Grotesque'}}>Ventures</h1>
          <p className="text-sm sm:text-base text-[#805c5c]" style={{fontFamily: 'Montserrat'}}>Manage your businesses and projects</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-[#223947] hover:bg-[#223947]/90 text-[#fffbf6] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Venture
        </Button>
      </div>

      {/* Ventures Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-[#805c5c]" style={{fontFamily: 'Montserrat'}}>Loading ventures...</div>
      ) : ventures.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#dbb4b4] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-[#805c5c]" />
          </div>
          <h3 className="text-lg font-semibold text-[#323232] mb-2" style={{fontFamily: 'Acherus Grotesque'}}>No ventures yet</h3>
          <p className="text-[#805c5c] mb-6" style={{fontFamily: 'Montserrat'}}>Create your first venture to get started</p>
          <Button onClick={handleCreateNew} className="bg-[#223947] hover:bg-[#223947]/90 text-[#fffbf6]">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Venture
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ventures.map((venture) => (
            <VentureCard
              key={venture.id}
              venture={venture}
              itemCount={itemCounts[venture.id] || 0}
              projectCount={projectCounts[venture.id] || 0}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <VentureModal
          venture={editingVenture}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}