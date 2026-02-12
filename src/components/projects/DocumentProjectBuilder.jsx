import React, { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Sparkles, Loader2, CheckCircle2, ChevronDown, ChevronRight, AlertTriangle, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const EXTRACTION_PROMPT = `You are Venturer's document extraction engine. Your job is to parse project rundown documents and extract a complete, structured project with milestones (phases) and tasks.

CRITICAL RULES:

1. Extract EVERY task. A task is ANY line that starts with a checkbox (■, □, ▪), bullet (-, *, •), or numbered item (1., 2., etc.) that appears under a "Tasks" heading within a phase/milestone. Do NOT skip tasks. Do NOT summarize or combine tasks. Each checkbox/bullet item = one task.

2. Phases/Milestones are top-level sections. They are typically labeled "PHASE 1:", "Phase 2:", "Milestone 1:", "Step 1:", or similar numbered/named section headers. Each phase becomes a milestone.

3. Notes and Reminders are metadata, not tasks. Lines under "Notes" or "Reminders" headings are contextual information. Attach them to their parent milestone as context, but do NOT create tasks from them.

4. Preserve the exact task text. Do not rewrite, shorten, or paraphrase task descriptions. Use the original wording from the document.

5. Preserve task order. Tasks must appear in the same order they appear in the document within each phase.

6. STEP values: If the document includes STEP values like (S:2, T:1, E:2, P:3), extract them. Otherwise default to s:2, t:2, e:2, p:2.

VALIDATION - Before responding, verify:
- ALL phases captured as milestones (count them)
- ALL checkbox/bullet tasks captured per phase (count them)
- total_tasks = sum of all tasks across all milestones
- Notes/Reminders are NOT counted as tasks
- Sub-options (Option A / Option B) ARE counted as tasks`;

export default function DocumentProjectBuilder({ initialVentureId, onComplete }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [stage, setStage] = useState('upload');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [extractionProgress, setExtractionProgress] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [ventureId, setVentureId] = useState(initialVentureId || '');
  const [milestones, setMilestones] = useState([]);
  const [extractionSummary, setExtractionSummary] = useState(null);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [editingTask, setEditingTask] = useState(null);

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.filter({ active: true }, 'name'),
  });

  const extractMutation = useMutation({
    mutationFn: async (uploadedFile) => {
      setExtractionProgress('Reading your document...');
      const documentText = await uploadedFile.text();

      if (!documentText || documentText.length < 50) {
        throw new Error('Could not extract text from PDF. Make sure the PDF contains selectable text.');
      }

      setExtractionProgress('AI is analyzing your document — extracting milestones and tasks...');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: EXTRACTION_PROMPT + "\n\n---\n\nHere is the full document text to extract from:\n\n" + documentText + "\n\n---\n\nExtract ALL milestones and tasks. Return ONLY the JSON object.",
        response_json_schema: {
          type: 'object',
          properties: {
            project_name: { type: 'string' },
            project_description: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  status: { type: 'string' },
                  notes: { type: 'array', items: { type: 'string' } },
                  reminders: { type: 'array', items: { type: 'string' } },
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        step: {
                          type: 'object',
                          properties: {
                            s: { type: 'number' },
                            t: { type: 'number' },
                            e: { type: 'number' },
                            p: { type: 'number' },
                          },
                        },
                        details: { type: 'string' },
                      },
                      required: ['title'],
                    },
                  },
                },
                required: ['name', 'tasks'],
              },
            },
            extraction_summary: {
              type: 'object',
              properties: {
                total_milestones: { type: 'number' },
                total_tasks: { type: 'number' },
              },
            },
          },
          required: ['project_name', 'milestones'],
        },
      });

      return response;
    },
    onSuccess: (data) => {
      setProjectName(data.project_name || 'Untitled Project');
      setDescription(data.project_description || '');

      const mapped = (data.milestones || []).map((m) => ({
        name: m.name || 'Unnamed Milestone',
        status: m.status || 'not_started',
        notes: m.notes || [],
        reminders: m.reminders || [],
        tasks: (m.tasks || []).map((t) => ({
          title: t.title || '',
          step: { s: t.step?.s || 2, t: t.step?.t || 2, e: t.step?.e || 2, p: t.step?.p || 2 },
          details: t.details || null,
        })),
      }));

      setMilestones(mapped);
      setExtractionSummary(data.extraction_summary || null);
      setExpandedMilestones({ 0: true });

      const totalTasks = mapped.reduce((s, m) => s + m.tasks.length, 0);
      toast.success('Extracted ' + mapped.length + ' milestones and ' + totalTasks + ' tasks!');
      setStage('review');
    },
    onError: (error) => {
      toast.error('Extraction failed: ' + error.message);
      setStage('upload');
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!ventureId) throw new Error('Please select a venture');
      if (!projectName.trim()) throw new Error('Please enter a project name');

      const project = await base44.entities.Project.create({
        venture_id: ventureId,
        name: projectName,
        description: description || undefined,
        status: 'active',
      });

      const tasksToCreate = [];
      milestones.forEach((milestone) => {
        milestone.tasks.filter(t => t.title.trim()).forEach((task) => {
          tasksToCreate.push({
            venture_id: ventureId,
            project_id: project.id,
            type: 'task',
            title: task.title,
            description: 'Part of: ' + milestone.name,
            status: 'not_started',
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

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      const totalTasks = milestones.reduce((s, m) => s + m.tasks.filter(t => t.title.trim()).length, 0);
      toast.success('Created "' + projectName + '" with ' + totalTasks + ' tasks!');
      if (onComplete) {
        onComplete(project);
      } else {
        navigate(createPageUrl('ProjectDetail') + '?id=' + project.id);
      }
    },
    onError: (error) => {
      toast.error('Failed to create project: ' + error.message);
    },
  });

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    setFile(selectedFile);
    setStage('extracting');
    extractMutation.mutate(selectedFile);
  }, [extractMutation]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const toggleMilestone = (idx) => {
    setExpandedMilestones(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const updateTaskTitle = (mi, ti, title) => {
    const updated = [...milestones];
    updated[mi].tasks[ti].title = title;
    setMilestones(updated);
  };

  const removeTask = (mi, ti) => {
    const updated = [...milestones];
    updated[mi].tasks.splice(ti, 1);
    setMilestones(updated);
  };

  const addTask = (mi) => {
    const updated = [...milestones];
    updated[mi].tasks.push({ title: '', step: { s: 2, t: 2, e: 2, p: 2 }, details: null });
    setMilestones(updated);
  };

  const totalTasks = milestones.reduce((s, m) => s + m.tasks.filter(t => t.title.trim()).length, 0);

  const reset = () => {
    setStage('upload');
    setFile(null);
    setProjectName('');
    setDescription('');
    setMilestones([]);
    setExtractionSummary(null);
    setExpandedMilestones({});
  };

  const StepPill = ({ label, value, color }) => (
    <Badge variant="outline" style={{ fontSize: 10, padding: "2px 7px", background: color + '15', color, borderColor: color + '30' }}>
      <span style={{ opacity: 0.6 }}>{label}</span>{value}
    </Badge>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#223947] to-[#805c5c] flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-[#fffbf6]" />
        </div>
        <h1 className="text-3xl font-bold text-[#223947] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Import from Document
        </h1>
        <p className="text-sm text-[#805c5c]">
          {stage === 'upload' && "Upload a project rundown PDF and we'll extract everything automatically."}
          {stage === 'extracting' && "Analyzing your document..."}
          {stage === 'review' && "Review what we extracted. Edit anything that needs adjusting."}
          {stage === 'configure' && "Almost there — just pick a venture and confirm."}
        </p>
      </div>

      {stage === 'upload' && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={'bg-white rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-200 ' + (dragOver ? 'border-[#805c5c] bg-[#805c5c]/5' : 'border-stone-200 hover:border-[#805c5c]/40 hover:bg-[#fffbf6]')}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#805c5c]/10 to-[#223947]/5 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-[#805c5c]" />
          </div>
          <p className="text-lg font-bold text-[#223947] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Drop your project rundown here
          </p>
          <p className="text-sm text-[#805c5c]">or click to browse · PDF files only</p>
          <div className="mt-6 pt-6 border-t border-stone-100">
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
              Works best with documents structured using the <span className="text-[#805c5c] font-medium">Ideal Format</span> — phases with tasks, notes, and reminders.
            </p>
          </div>
        </div>
      )}

      {stage === 'extracting' && (
        <div className="bg-white rounded-2xl p-12 border border-stone-200/50 text-center">
          <Loader2 className="w-10 h-10 text-[#805c5c] animate-spin mx-auto mb-6" />
          <p className="text-base font-semibold text-[#223947] mb-2">{extractionProgress}</p>
          {file && (
            <div className="inline-flex items-center gap-2 text-xs text-stone-400 bg-stone-50 px-3 py-1.5 rounded-lg mt-2">
              <FileText className="w-3 h-3" />
              {file.name}
            </div>
          )}
        </div>
      )}

      {stage === 'review' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🏔', value: milestones.length, label: 'Milestones' },
              { icon: '✦', value: totalTasks, label: 'Tasks' },
              { icon: '⟳', value: milestones.filter(m => m.status === 'in_progress').length, label: 'In Progress' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200/50 p-4 text-center">
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-[#223947]">{stat.value}</div>
                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className={'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ' + (totalTasks >= 10 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
            {totalTasks >= 10 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {totalTasks} tasks extracted across {milestones.length} milestones
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200/50">
            <Label className="text-xs font-semibold text-[#805c5c] uppercase tracking-wider">Project Name</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-2 text-lg font-bold border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto text-[#223947]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
            {description && <p className="text-sm text-stone-500 mt-2 leading-relaxed">{description}</p>}
          </div>

          {milestones.map((m, mi) => (
            <div key={mi} className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden">
              <button onClick={() => toggleMilestone(mi)} className="w-full flex items-center gap-3 p-4 hover:bg-stone-50/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#223947] to-[#805c5c] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{mi + 1}</div>
                <div className="flex-1 text-left">
                  <span className="font-bold text-sm text-[#223947]">{m.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-stone-400">{m.tasks.length} tasks</span>
                    {m.status === 'in_progress' && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-amber-50 text-amber-600 border-amber-200">In Progress</Badge>
                    )}
                  </div>
                </div>
                {expandedMilestones[mi] ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
              </button>
              <div className="h-0.5 bg-stone-100" />

              {expandedMilestones[mi] && (
                <div className="px-4 pb-4">
                  {m.tasks.map((task, ti) => (
                    <div key={ti} className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
                      <div className="w-5 h-5 border-2 border-stone-300 rounded mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {editingTask?.mi === mi && editingTask?.ti === ti ? (
                          <Input value={task.title} onChange={(e) => updateTaskTitle(mi, ti, e.target.value)} onBlur={() => setEditingTask(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingTask(null)} autoFocus className="text-sm h-auto py-1 px-2" />
                        ) : (
                          <span className="text-sm text-[#223947] cursor-pointer hover:text-[#805c5c] transition-colors" onClick={() => setEditingTask({ mi, ti })}>{task.title}</span>
                        )}
                        {task.details && <p className="text-xs text-stone-400 mt-0.5 italic">{task.details}</p>}
                        <div className="flex gap-1 mt-1.5">
                          <StepPill label="S" value={task.step.s} color="#223947" />
                          <StepPill label="T" value={task.step.t} color="#805c5c" />
                          <StepPill label="E" value={task.step.e} color="#5b8a72" />
                          <StepPill label="P" value={task.step.p} color="#223947" />
                        </div>
                      </div>
                      <button onClick={() => removeTask(mi, ti)} className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">✕</button>
                    </div>
                  ))}
                  <button onClick={() => addTask(mi)} className="w-full mt-2 py-2 text-xs text-stone-400 hover:text-[#805c5c] border border-dashed border-stone-200 rounded-lg hover:border-[#805c5c]/30 transition-colors">+ Add Task</button>

                  {(m.notes?.length > 0 || m.reminders?.length > 0) && (
                    <div className="mt-3 p-3 bg-[#fffbf6] rounded-lg text-xs text-stone-500 leading-relaxed">
                      {m.notes?.length > 0 && (
                        <div className="mb-2">
                          <span className="font-semibold text-stone-400 uppercase tracking-wider text-[10px]">Notes</span>
                          {m.notes.map((n, i) => <p key={i} className="mt-0.5">• {n}</p>)}
                        </div>
                      )}
                      {m.reminders?.length > 0 && (
                        <div>
                          <span className="font-semibold text-amber-500 uppercase tracking-wider text-[10px]">Reminders</span>
                          {m.reminders.map((r, i) => <p key={i} className="mt-0.5">⚡ {r}</p>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {stage === 'configure' && (
        <div className="bg-white rounded-2xl p-8 border border-stone-200/50 space-y-6">
          <div className="text-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#223947]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{projectName}</h2>
            <p className="text-sm text-stone-500 mt-1">{milestones.length} milestones · {totalTasks} tasks · Ready to create</p>
          </div>
          <div>
            <Label>Which venture does this belong to? <span className="text-red-500">*</span></Label>
            <Select value={ventureId} onValueChange={setVentureId}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Select a venture..." /></SelectTrigger>
              <SelectContent>
                {ventures.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded bg-[#223947]/10 flex items-center justify-center text-xs font-bold text-[#223947]">{i + 1}</div>
                <span className="flex-1 font-medium text-[#223947]">{m.name}</span>
                <span className="text-stone-400 text-xs">{m.tasks.length} tasks</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6 gap-3">
        {stage === 'upload' && <div />}
        {stage === 'review' && (
          <Button variant="outline" onClick={reset}><RotateCcw className="w-4 h-4 mr-2" /> Start Over</Button>
        )}
        {stage === 'configure' && (
          <Button variant="outline" onClick={() => setStage('review')}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Review</Button>
        )}
        {stage === 'review' && (
          <Button onClick={() => setStage('configure')}>Looks Good — Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
        )}
        {stage === 'configure' && (
          <Button onClick={() => createProjectMutation.mutate()} disabled={createProjectMutation.isPending || !ventureId} className="bg-gradient-to-r from-[#223947] to-[#805c5c]">
            {createProjectMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>) : (<><CheckCircle2 className="w-5 h-5 mr-2" />Create Project</>)}
          </Button>
        )}
      </div>
    </div>
  );
}