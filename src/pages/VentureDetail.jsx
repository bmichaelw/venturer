import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Folder, CheckCircle2, Clock, Sparkles, Trash2, Upload, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DocumentList from '../components/documents/DocumentList';
import AddItemModal from '../components/dump/AddItemModal';
import TemplateSelector from '../components/templates/TemplateSelector';
import { format, parseISO, addDays } from 'date-fns';
import { toast } from 'sonner';

export default function VentureDetailPage() {
  const [searchParams] = useSearchParams();
  const ventureId = searchParams.get('id');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [workstreams, setWorkstreams] = useState([]);
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId) => {
      // Delete all items in this project
      await base44.entities.Item.filter({ project_id: projectId }).then(items =>
        Promise.all(items.map(item => base44.entities.Item.delete(item.id)))
      );
      // Delete the project
      await base44.entities.Project.delete(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', ventureId] });
      queryClient.invalidateQueries({ queryKey: ['items', ventureId] });
    },
  });

  const { data: venture } = useQuery({
    queryKey: ['venture', ventureId],
    queryFn: async () => {
      const ventures = await base44.entities.Venture.filter({ id: ventureId });
      return ventures[0];
    },
    enabled: !!ventureId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', ventureId],
    queryFn: () => base44.entities.Project.filter({ venture_id: ventureId }, 'name'),
    enabled: !!ventureId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items', ventureId],
    queryFn: () => base44.entities.Item.filter({ venture_id: ventureId }),
    enabled: !!ventureId,
  });



  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      const project = await base44.entities.Project.create(projectData);
      
      // Create milestones and workstreams
      const createdMilestones = [];
      const createdWorkstreams = [];
      
      if (milestones.length > 0) {
        for (const milestone of milestones) {
          const created = await base44.entities.Milestone.create({
            ...milestone,
            project_id: project.id
          });
          createdMilestones.push(created);
        }
      }
      
      if (workstreams.length > 0) {
        for (const workstream of workstreams) {
          await base44.entities.Workstream.create({
            ...workstream,
            project_id: project.id
          });
        }
      }
      
      // If using template, create tasks from milestones
      if (selectedTemplate && selectedTemplate.milestones?.length > 0) {
        const today = new Date();
        const tasksToCreate = [];
        const taskIdMap = {}; // Map template task IDs to created task IDs
        
        // First pass: create all tasks
        selectedTemplate.milestones.forEach((milestone) => {
          if (milestone.tasks && milestone.tasks.length > 0) {
            milestone.tasks.forEach((task) => {
              const dueDate = task.days_offset ? addDays(today, task.days_offset) : null;
              const taskData = {
                venture_id: ventureId,
                project_id: project.id,
                type: 'task',
                title: task.title,
                description: task.description || `Part of: ${milestone.name}`,
                status: 'not_started',
                due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
                s_sextant: task.step?.s,
                t_time: task.step?.t,
                e_effort: task.step?.e,
                p_priority: task.step?.p,
                assigned_to: task.assignee_type === 'user' ? task.default_assignee : null,
              };
              
              // Add note about role if it's a role assignment
              if (task.assignee_type === 'role' && task.default_assignee) {
                taskData.description = `${taskData.description}\n\nRole: ${task.default_assignee}`;
              }
              
              tasksToCreate.push({ templateId: task.id, taskData });
            });
          }
        });
        
        if (tasksToCreate.length > 0) {
          const createdTasks = await base44.entities.Item.bulkCreate(
            tasksToCreate.map(t => t.taskData)
          );
          
          // Build task ID mapping
          tasksToCreate.forEach((t, idx) => {
            if (createdTasks[idx]) {
              taskIdMap[t.templateId] = createdTasks[idx].id;
            }
          });
          
          // Second pass: update tasks with dependencies
          const dependencyUpdates = [];
          selectedTemplate.milestones.forEach((milestone) => {
            if (milestone.tasks && milestone.tasks.length > 0) {
              milestone.tasks.forEach((task) => {
                if (task.dependencies && task.dependencies.length > 0) {
                  const createdTaskId = taskIdMap[task.id];
                  if (createdTaskId) {
                    const blockerId = taskIdMap[task.dependencies[0]]; // Use first dependency as blocker
                    if (blockerId) {
                      dependencyUpdates.push(
                        base44.entities.Item.update(createdTaskId, { blocked_by: blockerId })
                      );
                    }
                  }
                }
              });
            }
          });
          
          if (dependencyUpdates.length > 0) {
            await Promise.all(dependencyUpdates);
          }
        }
      }
      
      // Create tasks from PDF extraction
      if (extractedTasks.length > 0) {
        const today = new Date();
        const tasksToCreate = extractedTasks.map(task => ({
          venture_id: ventureId,
          project_id: project.id,
          type: 'task',
          title: task.title,
          description: task.description || '',
          status: 'not_started',
          s_sextant: task.step?.s,
          t_time: task.step?.t,
          e_effort: task.step?.e,
          p_priority: task.step?.p,
        }));
        
        await base44.entities.Item.bulkCreate(tasksToCreate);
      }
      
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', ventureId] });
      queryClient.invalidateQueries({ queryKey: ['items', ventureId] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['workstreams'] });
      setShowProjectModal(false);
      setShowTemplateSelector(false);
      setSelectedTemplate(null);
      setProjectName('');
      setProjectDescription('');
      setMilestones([]);
      setWorkstreams([]);
      setExtractedTasks([]);
    },
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    createProjectMutation.mutate({
      venture_id: ventureId,
      name: projectName,
      description: projectDescription,
      status: selectedTemplate?.default_status || 'active',
    });
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setProjectName(template.name);
    setProjectDescription(template.description || '');
    setShowTemplateSelector(false);
  };

  const handleOpenProjectModal = () => {
    setShowTemplateSelector(true);
    setShowProjectModal(true);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsProcessingPdf(true);
    try {
      // Upload the PDF
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedPdf(file_url);

      // Use AI to extract project details from the PDF
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this project document thoroughly and extract structured information:

      1. PROJECT TITLE: Clear, concise project name

      2. PROJECT DESCRIPTION: Comprehensive overview (3-5 sentences) covering:
      - What the project is about
      - Main objectives/goals
      - Expected outcomes
      - Target timeline if mentioned

      3. PROJECT SCOPE: Detailed breakdown of what's included and excluded:
      - In-scope items and deliverables
      - Out-of-scope items (if mentioned)
      - Key assumptions
      - Constraints or dependencies

      4. MILESTONES: Major project phases or checkpoints with:
      - Clear milestone title
      - Description of what defines completion
      - Expected deliverables at that milestone
      - Estimated timeline/duration if mentioned

      5. WORKSTREAMS: Distinct work areas or tracks with:
      - Workstream name/title
      - Brief description of focus area
      - Key responsibilities

      6. TASKS/DELIVERABLES: Specific actionable items with:
      - Task title
      - Detailed description of what needs to be done
      - Dependencies if mentioned
      - Priority indicators if present

      Extract all available information from the document. Be comprehensive but precise. If certain sections aren't present in the document, return empty arrays for those sections.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            project_name: { type: 'string' },
            project_description: { type: 'string' },
            scope: {
              type: 'object',
              properties: {
                in_scope: { type: 'array', items: { type: 'string' } },
                out_of_scope: { type: 'array', items: { type: 'string' } },
                assumptions: { type: 'array', items: { type: 'string' } },
                constraints: { type: 'array', items: { type: 'string' } }
              }
            },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  deliverables: { type: 'array', items: { type: 'string' } },
                  estimated_duration: { type: 'string' }
                }
              }
            },
            workstreams: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string' }
                }
              }
            }
          }
        }
      });

      // Populate form with extracted data
      if (response.project_name) setProjectName(response.project_name);

      // Build comprehensive description with scope
      let fullDescription = response.project_description || '';
      if (response.scope) {
        if (response.scope.in_scope?.length > 0) {
          fullDescription += '\n\n📋 IN SCOPE:\n' + response.scope.in_scope.map(item => `• ${item}`).join('\n');
        }
        if (response.scope.out_of_scope?.length > 0) {
          fullDescription += '\n\n🚫 OUT OF SCOPE:\n' + response.scope.out_of_scope.map(item => `• ${item}`).join('\n');
        }
        if (response.scope.assumptions?.length > 0) {
          fullDescription += '\n\n💭 ASSUMPTIONS:\n' + response.scope.assumptions.map(item => `• ${item}`).join('\n');
        }
        if (response.scope.constraints?.length > 0) {
          fullDescription += '\n\n⚠️ CONSTRAINTS:\n' + response.scope.constraints.map(item => `• ${item}`).join('\n');
        }
      }
      setProjectDescription(fullDescription);

      if (response.milestones?.length > 0) {
        setMilestones(response.milestones.map(m => ({ 
          title: m.title, 
          status: 'not_started', 
          description: m.description + (m.deliverables?.length ? '\n\nDeliverables:\n' + m.deliverables.map(d => `• ${d}`).join('\n') : '')
        })));
      }
      if (response.workstreams?.length > 0) {
        setWorkstreams(response.workstreams.map(w => ({ 
          title: w.title, 
          description: w.description,
          status: 'active', 
          color: '#3B82F6' 
        })));
      }

      setShowTemplateSelector(false);
      toast.success('Project details extracted from PDF!');
    } catch (error) {
      toast.error('Failed to process PDF: ' + error.message);
      setUploadedPdf(null);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  if (!venture) {
    return <div className="text-center py-12">Loading venture...</div>;
  }

  const tasks = items.filter(i => i.type === 'task');
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/Ventures" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Ventures
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200/50 p-4 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: venture.color }}
            >
              <span className="text-xl sm:text-2xl text-white font-bold">
                {venture.name[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-[#323232] mb-2">{venture.name}</h1>
              {venture.description && (
                <p className="text-[#805c5c]" style={{fontFamily: 'Montserrat'}}>{venture.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
          <div className="text-center p-3 sm:p-4 bg-stone-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{projects.length}</div>
            <div className="text-xs sm:text-sm text-slate-600">Projects</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-stone-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{items.length}</div>
            <div className="text-xs sm:text-sm text-slate-600">Total Items</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-stone-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Completion</div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="border-t border-stone-200 pt-6">
          <DocumentList entityType="venture" entityId={ventureId} />
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Quick Add</h2>
          <Button onClick={() => setShowAddItemModal(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Note/Idea/Task
          </Button>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Tasks</h2>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No tasks in this venture yet
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <Link
                key={task.id}
                to={`/ItemDetail?id=${task.id}`}
                className="block border border-stone-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-slate-500 mt-2">
                          Due: {format(parseISO(task.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="bg-white rounded-2xl border border-stone-200/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-900">Projects</h2>
          <div className="flex gap-2">
            <Link to={createPageUrl('ProjectBuilder') + '?ventureId=' + ventureId} className="flex-1 sm:flex-initial">
              <Button size="sm" variant="outline" className="gap-2 w-full">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Build</span>
              </Button>
            </Link>
            <Button onClick={handleOpenProjectModal} size="sm" className="flex-1 sm:flex-initial">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Quick Add</span>
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No projects in this venture yet
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(project => {
              const projectItems = items.filter(i => i.project_id === project.id);
              const projectTasks = projectItems.filter(i => i.type === 'task');
              const completed = projectTasks.filter(t => t.status === 'completed').length;

              return (
                <div key={project.id} className="border border-stone-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                  <Link
                    to={`/ProjectDetail?id=${project.id}`}
                    className="block p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-slate-500" />
                        <div>
                          <h3 className="font-semibold text-slate-900">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-start gap-2">
                        <div>
                          <Badge variant={project.status === 'completed' ? 'default' : 'outline'}>
                            {project.status}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {completed}/{projectTasks.length} tasks
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm(`Delete project "${project.name}"? This will also delete all its tasks.`)) {
                              deleteProjectMutation.mutate(project.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <Dialog open={showProjectModal} onOpenChange={(open) => {
        setShowProjectModal(open);
        if (!open) {
          setShowTemplateSelector(false);
          setSelectedTemplate(null);
          setProjectName('');
          setProjectDescription('');
          setMilestones([]);
          setWorkstreams([]);
          setUploadedPdf(null);
          setIsProcessingPdf(false);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>
          
          {showTemplateSelector ? (
            <div className="space-y-4">
              <TemplateSelector
                onSelect={handleTemplateSelect}
                onSkip={() => setShowTemplateSelector(false)}
              />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={isProcessingPdf}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  {isProcessingPdf ? (
                    <>
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                      <p className="text-sm font-medium">Processing PDF...</p>
                    </>
                  ) : (
                    <>
                      <FileText className="w-10 h-10 text-gray-400" />
                      <p className="text-sm font-medium">Upload Project PDF</p>
                      <p className="text-xs text-gray-500 max-w-xs">
                        Upload a PDF document that outlines your project. AI will automatically extract the project name, description, milestones, and tasks to create your project structure.
                      </p>
                      <div className="mt-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                        <Upload className="w-4 h-4" />
                        Choose PDF
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateProject} className="space-y-4">
              {selectedTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    Using template: <strong>{selectedTemplate.name}</strong>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This will create {selectedTemplate.milestones?.reduce((sum, m) => sum + (m.tasks?.length || 0), 0) || 0} tasks across {selectedTemplate.milestones?.length || 0} milestones
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setShowTemplateSelector(true);
                    }}
                    className="mt-2 h-7 text-xs"
                  >
                    Choose Different Template
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description (optional)</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <Label>Milestones (optional)</Label>
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Milestone title"
                      value={milestone.title}
                      onChange={(e) => {
                        const updated = [...milestones];
                        updated[index].title = e.target.value;
                        setMilestones(updated);
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMilestones(milestones.filter((_, i) => i !== index));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMilestones([...milestones, { title: '', status: 'not_started' }])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Milestone
                </Button>
              </div>

              {/* Workstreams */}
              <div className="space-y-2">
                <Label>Workstreams (optional)</Label>
                {workstreams.map((workstream, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Workstream title"
                      value={workstream.title}
                      onChange={(e) => {
                        const updated = [...workstreams];
                        updated[index].title = e.target.value;
                        setWorkstreams(updated);
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setWorkstreams(workstreams.filter((_, i) => i !== index));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWorkstreams([...workstreams, { title: '', status: 'active', color: '#3B82F6' }])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workstream
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowProjectModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <AddItemModal 
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        ventureId={ventureId}
      />
    </div>
  );
}