import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Plus, Trash2, Check, Sparkles, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const sextantOptions = [
  { value: 1, label: "Urgent & Important", short: "S1" },
  { value: 2, label: "Not Urgent but Important", short: "S2" },
  { value: 3, label: "Urgent but Not Important", short: "S3" },
  { value: 4, label: "Not Urgent & Not Important", short: "S4" },
  { value: 5, label: "Late but Important", short: "S5" },
  { value: 6, label: "Late & Not Important", short: "S6" },
];
const timeOptions = [
  { value: 1, label: "Short" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Long" },
];
const effortOptions = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
];
const priorityOptions = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
];

const ProgressDots = ({ steps, current }) => (
  <div className="flex items-center gap-1.5">
    {steps.map((s, i) => (
      <div
        key={i}
        className="h-2 rounded-full transition-all duration-300"
        style={{
          width: i === current ? 28 : 8,
          background: i < current ? "#223947" : i === current ? "#805c5c" : "rgba(34,57,71,0.12)",
        }}
      />
    ))}
  </div>
);

const StepPill = ({ label, value, color }) => (
  <Badge variant="outline" style={{ fontSize: 10, padding: "2px 7px", background: `${color}15`, color, borderColor: `${color}30` }}>
    <span style={{ opacity: 0.6 }}>{label}</span>{value}
  </Badge>
);

export default function ProjectBuilder({ initialVentureId, onComplete }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlVentureId = searchParams.get('ventureId');
  const urlProjectId = searchParams.get('projectId');
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [ventureId, setVentureId] = useState(initialVentureId || urlVentureId || "");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [milestones, setMilestones] = useState([
    { name: "", tasks: [{ title: "", step: { s: 2, t: 2, e: 2, p: 2 } }] }
  ]);
  const [activeMilestone, setActiveMilestone] = useState(0);
  const [expandedReview, setExpandedReview] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({ active: true }, 'name'),
  });

  // Load existing project if editing
  const { data: existingProject } = useQuery({
    queryKey: ['project', urlProjectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: urlProjectId });
      return projects[0];
    },
    enabled: !!urlProjectId,
  });

  const { data: existingTasks = [] } = useQuery({
    queryKey: ['items', urlProjectId],
    queryFn: () => base44.entities.Item.filter({ project_id: urlProjectId, type: 'task' }),
    enabled: !!urlProjectId,
  });

  // Populate form when editing
  React.useEffect(() => {
    if (existingProject && !isEditMode) {
      setProjectName(existingProject.name);
      setVentureId(existingProject.venture_id);
      setDescription(existingProject.description || "");
      setIsEditMode(true);

      // Group tasks by milestone (if they have milestone in description)
      const tasksByMilestone = {};
      existingTasks.forEach(task => {
        const milestoneMatch = task.description?.match(/Part of: (.+)/);
        const milestoneName = milestoneMatch ? milestoneMatch[1] : "Tasks";
        if (!tasksByMilestone[milestoneName]) {
          tasksByMilestone[milestoneName] = [];
        }
        tasksByMilestone[milestoneName].push({
          title: task.title,
          step: {
            s: task.s_sextant || 2,
            t: task.t_time || 2,
            e: task.e_effort || 2,
            p: task.p_priority || 2,
          }
        });
      });

      const loadedMilestones = Object.keys(tasksByMilestone).map(name => ({
        name,
        tasks: tasksByMilestone[name]
      }));

      if (loadedMilestones.length > 0) {
        setMilestones(loadedMilestones);
      }
    }
  }, [existingProject, existingTasks, isEditMode]);

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      let project;
      
      if (isEditMode && urlProjectId) {
        // Update existing project
        await base44.entities.Project.update(urlProjectId, {
          name: projectName,
          description: description || undefined,
        });
        project = { ...existingProject, name: projectName, description };
        
        // Delete existing tasks to recreate them
        const deletePromises = existingTasks.map(task => 
          base44.entities.Item.delete(task.id)
        );
        await Promise.all(deletePromises);
      } else {
        // Create new project
        project = await base44.entities.Project.create({
          venture_id: ventureId,
          name: projectName,
          description: description || undefined,
          status: 'active',
        });
      }

      // Create tasks from milestones
      const tasksToCreate = [];
      milestones.forEach((milestone, mIdx) => {
        milestone.tasks.filter(t => t.title.trim()).forEach((task, tIdx) => {
          tasksToCreate.push({
            venture_id: ventureId,
            project_id: project.id,
            type: 'task',
            title: task.title,
            description: `Part of: ${milestone.name}`,
            status: 'not_started',
            due_date: startDate || null,
            s_sextant: task.step.s,
            t_time: task.step.t,
            e_effort: task.step.e,
            p_priority: task.step.p,
          });
        });
      });

      if (tasksToCreate.length > 0) {
        await base44.entities.Item.bulkCreate(tasksToCreate);
      }

      // Optionally save as template
      if (saveAsTemplate) {
        await base44.entities.ProjectTemplate.create({
          name: projectName,
          description: description,
          category: 'other',
          icon_name: 'Briefcase',
          color: '#223947',
          estimated_duration_days: 30,
          milestones: milestones.filter(m => m.name.trim()).map(m => ({
            name: m.name,
            description: '',
            tasks: m.tasks.filter(t => t.title.trim()).map(t => ({
              id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: t.title,
              description: '',
              days_offset: 0,
              step: t.step,
            })),
          })),
        });
      }

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success(isEditMode ? `Project "${projectName}" updated!` : `Project "${projectName}" created!`);
      
      if (onComplete) {
        onComplete(project);
      } else {
        navigate(createPageUrl('ProjectDetail') + '?id=' + project.id);
      }
    },
  });

  const steps = ["Project Info", "Milestones", "Tasks", "Review"];
  
  const canAdvance = () => {
    if (step === 0) return projectName.trim() && ventureId;
    if (step === 1) return milestones.every(m => m.name.trim());
    if (step === 2) return milestones.every(m => m.tasks.some(t => t.title.trim()));
    return true;
  };

  const addMilestone = () => {
    setMilestones([...milestones, { name: "", tasks: [{ title: "", step: { s: 2, t: 2, e: 2, p: 2 } }] }]);
  };

  const removeMilestone = (i) => {
    if (milestones.length <= 1) return;
    const updated = milestones.filter((_, idx) => idx !== i);
    setMilestones(updated);
    if (activeMilestone >= updated.length) setActiveMilestone(updated.length - 1);
  };

  const updateMilestoneName = (i, name) => {
    const updated = [...milestones];
    updated[i].name = name;
    setMilestones(updated);
  };

  const addTask = (mi) => {
    const updated = [...milestones];
    updated[mi].tasks.push({ title: "", step: { s: 2, t: 2, e: 2, p: 2 } });
    setMilestones(updated);
  };

  const removeTask = (mi, ti) => {
    const updated = [...milestones];
    if (updated[mi].tasks.length <= 1) return;
    updated[mi].tasks = updated[mi].tasks.filter((_, idx) => idx !== ti);
    setMilestones(updated);
  };

  const updateTaskTitle = (mi, ti, title) => {
    const updated = [...milestones];
    updated[mi].tasks[ti].title = title;
    setMilestones(updated);
  };

  const updateTaskStep = (mi, ti, field, value) => {
    const updated = [...milestones];
    updated[mi].tasks[ti].step[field] = value;
    setMilestones(updated);
  };

  const totalTasks = milestones.reduce((acc, m) => acc + m.tasks.filter(t => t.title.trim()).length, 0);
  const validMilestones = milestones.filter(m => m.name.trim()).length;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#223947] to-[#805c5c] flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-[#fffbf6]" />
        </div>
        <h1 className="text-3xl font-bold text-[#223947] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {isEditMode ? 'Expand Your Project' : 'Build Your Project'}
        </h1>
        <p className="text-sm text-[#805c5c]">
          {step === 0 && "Let's start with the basics."}
          {step === 1 && "Break your project into phases or milestones."}
          {step === 2 && "Now fill in the tasks for each milestone."}
          {step === 3 && "Here's what you've built. Look good?"}
        </p>

        <div className="flex justify-center items-center mt-6 flex-col gap-2">
          <ProgressDots steps={steps} current={step} />
          <div className="text-xs text-slate-500 font-medium">
            Step {step + 1} of {steps.length}: {steps[step]}
          </div>
        </div>
      </div>

      {/* Step 0: Project Info */}
      {step === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-stone-200/50 space-y-6">
          <div>
            <Label htmlFor="name">What's this project called? <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              placeholder="e.g., New Website Launch"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="venture">Which venture does it belong to? <span className="text-red-500">*</span></Label>
            <Select value={ventureId} onValueChange={setVentureId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a venture..." />
              </SelectTrigger>
              <SelectContent>
                {ventures.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startDate">When does it start?</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Brief description <span className="text-slate-400">(optional)</span></Label>
            <Textarea
              id="description"
              placeholder="What's this project about? What does success look like?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {/* Step 1: Milestones */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-8 border border-stone-200/50">
          <p className="text-sm text-[#805c5c] mb-6 leading-relaxed">
            Think of milestones as phases — like "Planning", "Execution", "Launch". You can always rename or add more later.
          </p>

          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                  m.name.trim() ? 'bg-[#223947]/10 text-[#223947]' : 'bg-stone-100 text-stone-400'
                }`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {m.name.trim() ? i + 1 : "—"}
                </div>
                <Input
                  placeholder={`Milestone ${i + 1} — e.g., ${
                    i === 0 ? "Planning & Discovery" :
                    i === 1 ? "Build & Execute" :
                    i === 2 ? "Review & Launch" : "Next Phase"
                  }`}
                  value={m.name}
                  onChange={(e) => updateMilestoneName(i, e.target.value)}
                  className="flex-1"
                />
                {milestones.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMilestone(i)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addMilestone}
            className="w-full mt-4 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Another Milestone
          </Button>
        </div>
      )}

      {/* Step 2: Tasks */}
      {step === 2 && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {milestones.map((m, i) => (
              <Button
                key={i}
                variant={activeMilestone === i ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveMilestone(i)}
                className="rounded-full"
              >
                {m.name || `Milestone ${i + 1}`}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {m.tasks.filter(t => t.title.trim()).length}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200/50">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#223947]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {milestones[activeMilestone].name || `Milestone ${activeMilestone + 1}`}
              </h3>
              <p className="text-xs text-slate-500">What needs to happen in this phase?</p>
            </div>

            <div className="space-y-4">
              {milestones[activeMilestone].tasks.map((task, ti) => (
                <div key={ti} className={`border rounded-xl p-4 ${task.title.trim() ? 'bg-[#fffbf6]' : 'bg-white'}`}>
                  <div className="flex gap-3 items-center mb-3">
                    <div className="w-5 h-5 border-2 border-stone-300 rounded flex items-center justify-center flex-shrink-0">
                      {task.title.trim() && <Check className="w-3 h-3 text-[#223947]" />}
                    </div>
                    <Input
                      placeholder={`Task ${ti + 1} — e.g., ${
                        ti === 0 ? "Define project scope" :
                        ti === 1 ? "Research competitors" :
                        ti === 2 ? "Create first draft" : "Next task..."
                      }`}
                      value={task.title}
                      onChange={(e) => updateTaskTitle(activeMilestone, ti, e.target.value)}
                      className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto font-medium"
                    />
                    {milestones[activeMilestone].tasks.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(activeMilestone, ti)}
                        className="flex-shrink-0 h-8 w-8"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-stone-400 hover:text-red-500" />
                      </Button>
                    )}
                  </div>

                  {task.title.trim() && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t">
                      <div>
                        <Label className="text-xs mb-1">S — Sextant</Label>
                        <Select value={String(task.step.s)} onValueChange={(v) => updateTaskStep(activeMilestone, ti, "s", Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sextantOptions.map(o => (
                              <SelectItem key={o.value} value={String(o.value)}>{o.short} — {o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1">T — Time</Label>
                        <Select value={String(task.step.t)} onValueChange={(v) => updateTaskStep(activeMilestone, ti, "t", Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map(o => (
                              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1">E — Effort</Label>
                        <Select value={String(task.step.e)} onValueChange={(v) => updateTaskStep(activeMilestone, ti, "e", Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {effortOptions.map(o => (
                              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1">P — Priority</Label>
                        <Select value={String(task.step.p)} onValueChange={(v) => updateTaskStep(activeMilestone, ti, "p", Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {priorityOptions.map(o => (
                              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => addTask(activeMilestone)}
              className="w-full mt-4 border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div>
          <div className="bg-white rounded-2xl p-6 border border-stone-200/50 mb-4">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#223947] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {projectName}
                </h2>
                <p className="text-sm text-[#805c5c]">
                  {ventures.find(v => v.id === ventureId)?.name}
                  {startDate && ` · Starting ${startDate}`}
                </p>
                {description && (
                  <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed">{description}</p>
                )}
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#223947]">{validMilestones}</div>
                  <div className="text-xs text-slate-500">milestones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#805c5c]">{totalTasks}</div>
                  <div className="text-xs text-slate-500">tasks</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {milestones.filter(m => m.name.trim()).map((m, mi) => (
                <div key={mi} className="border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedReview(expandedReview === mi ? null : mi)}
                    className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#223947]/10 flex items-center justify-center text-sm font-bold text-[#223947]">
                        {mi + 1}
                      </div>
                      <span className="font-bold text-sm text-[#223947]">{m.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {m.tasks.filter(t => t.title.trim()).length} tasks
                      </Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedReview === mi ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedReview === mi && (
                    <div className="px-4 pb-4 space-y-2">
                      {m.tasks.filter(t => t.title.trim()).map((task, ti) => (
                        <div key={ti} className="flex items-center justify-between py-2 border-t gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-4 h-4 border-2 border-stone-300 rounded flex-shrink-0" />
                            <span className="text-sm">{task.title}</span>
                          </div>
                          <div className="flex gap-1">
                            <StepPill label="S" value={task.step.s} color="#223947" />
                            <StepPill label="T" value={task.step.t} color="#805c5c" />
                            <StepPill label="E" value={task.step.e} color="#5b8a72" />
                            <StepPill label="P" value={task.step.p} color="#223947" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 bg-white rounded-xl p-4 border border-stone-200/50 cursor-pointer hover:bg-stone-50 transition-colors">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="w-4 h-4 accent-[#223947]"
            />
            <span className="text-sm font-medium">Also save this as a reusable template</span>
          </label>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6 gap-3">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        ) : <div />}

        {step < 3 ? (
          <Button onClick={() => canAdvance() && setStep(step + 1)} disabled={!canAdvance()}>
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => createProjectMutation.mutate()}
            disabled={createProjectMutation.isPending}
            className="bg-gradient-to-r from-[#223947] to-[#805c5c]"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {createProjectMutation.isPending 
              ? (isEditMode ? 'Updating...' : 'Creating...') 
              : (isEditMode ? 'Update Project' : 'Create Project')}
          </Button>
        )}
      </div>
    </div>
  );
}