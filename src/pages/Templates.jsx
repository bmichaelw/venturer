import { useState } from "react";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Globe, Rocket, Users, Calendar as CalendarIcon, Music, GraduationCap } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import TemplateEditorModal from '../components/templates/TemplateEditorModal';
import DynamicFieldsForm from '../components/templates/DynamicFieldsForm';

/* ───────── icon helpers ───────── */
const Icon = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const ChevronRight = ({ className }) => <Icon className={className} d="M9 18l6-6-6-6" />;
const Plus = ({ className }) => <Icon className={className} d="M12 5v14M5 12h14" />;
const Search = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const Clock = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CheckCircle = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const Layers = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const Bookmark = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
const ArrowLeft = ({ className }) => <Icon className={className} d="M19 12H5M12 19l-7-7 7-7" />;
const Megaphone = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>;
const Save = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;

const categories = ["All", "Business", "Creative", "Marketing", "Education", "Operations"];

const iconMap = {
  Globe, Rocket, Megaphone, Users, CalendarIcon, Music, GraduationCap
};

const StepBadge = ({ label, value, color }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 3,
    fontSize: 10, fontWeight: 600, padding: "2px 7px",
    borderRadius: 6, background: `${color}15`, color: color,
    fontFamily: "'Montserrat', sans-serif",
  }}>
    <span style={{ opacity: 0.6 }}>{label}</span>{value}
  </span>
);

export default function TemplatesPage() {
  const [view, setView] = useState("browse");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedVenture, setSelectedVenture] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sourceProject, setSourceProject] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Business");
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [dynamicFieldValues, setDynamicFieldValues] = useState({});

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: dbTemplates = [] } = useQuery({
    queryKey: ['projectTemplates'],
    queryFn: () => base44.entities.ProjectTemplate.list('-created_date'),
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ['ventures'],
    queryFn: () => base44.entities.Venture.list('name'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list('name'),
  });

  const createProjectMutation = useMutation({
    mutationFn: async ({ template, projectName, ventureId, startDate }) => {
      const project = await base44.entities.Project.create({
        venture_id: ventureId,
        name: projectName,
        description: template.description,
        status: 'active',
      });

      const start = new Date(startDate);
      const tasksToCreate = [];
      
      template.milestones?.forEach((milestone) => {
        milestone.tasks?.forEach((task) => {
          const dueDate = task.days_offset ? addDays(start, task.days_offset || 0) : null;
          tasksToCreate.push({
            venture_id: ventureId,
            project_id: project.id,
            type: 'task',
            title: task.title,
            description: task.description || '',
            status: task.status || 'not_started',
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
            s_sextant: task.step?.s,
            t_time: task.step?.t,
            e_effort: task.step?.e,
            p_priority: task.step?.p,
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
      toast.success('Project created successfully!');
      navigate(`/ProjectDetail?id=${project.id}`);
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ projectId, templateName, category }) => {
      const projectTasks = await base44.entities.Item.filter({ project_id: projectId, type: 'task' });
      
      const milestones = {};
      projectTasks.forEach(task => {
        const week = task.due_date ? `Week ${Math.ceil((new Date(task.due_date) - new Date()) / (7 * 24 * 60 * 60 * 1000))}` : 'Ongoing';
        if (!milestones[week]) milestones[week] = { name: week, week, tasks: [] };
        milestones[week].tasks.push({
          title: task.title,
          description: task.description,
          status: task.status,
          days_offset: 0,
          step: {
            s: task.s_sextant,
            t: task.t_time,
            e: task.e_effort,
            p: task.p_priority,
          },
        });
      });

      const project = projects.find(p => p.id === projectId);
      
      return base44.entities.ProjectTemplate.create({
        name: templateName,
        description: project?.description || '',
        category: category.toLowerCase(),
        milestones: Object.values(milestones),
        tasks: projectTasks.map(t => ({
          title: t.title,
          description: t.description,
          status: t.status,
          s_sextant: t.s_sextant,
          t_time: t.t_time,
          e_effort: t.e_effort,
          p_priority: t.p_priority,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success('Template saved!');
      setShowSaveModal(false);
      setSourceProject("");
      setTemplateName("");
    },
  });

  const templates = dbTemplates.map(t => ({
    ...t,
    icon: iconMap[t.icon_name] || Globe,
    color: t.color || "#223947",
    taskCount: t.tasks?.length || 0,
    milestoneCount: t.milestones?.length || 0,
    duration: t.estimated_duration_days ? `${t.estimated_duration_days} days` : 'Varies',
  }));

  const filtered = templates.filter(t => {
    const matchCat = activeCategory === "All" || t.category === activeCategory.toLowerCase();
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const openPreview = (t) => { 
    setSelectedTemplate(t); 
    setExpandedMilestone(0); 
    setProjectName(t.name);
    setView("preview"); 
  };

  const handleCreateProject = () => {
    if (!projectName.trim() || !selectedVenture) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate dynamic fields
    const requiredFields = (selectedTemplate.dynamic_fields || []).filter(f => f.required);
    for (const field of requiredFields) {
      if (!dynamicFieldValues[field.id]) {
        toast.error(`Please fill in: ${field.label}`);
        return;
      }
    }

    // Replace placeholders in task titles/descriptions with dynamic field values
    const processedTemplate = {
      ...selectedTemplate,
      milestones: selectedTemplate.milestones?.map(m => ({
        ...m,
        tasks: m.tasks?.map(t => ({
          ...t,
          title: replacePlaceholders(t.title, dynamicFieldValues),
          description: replacePlaceholders(t.description, dynamicFieldValues),
        })),
      })),
    };

    createProjectMutation.mutate({
      template: processedTemplate,
      projectName: replacePlaceholders(projectName, dynamicFieldValues),
      ventureId: selectedVenture,
      startDate,
    });
  };

  const replacePlaceholders = (text, values) => {
    if (!text) return text;
    let result = text;
    Object.entries(values).forEach(([fieldId, value]) => {
      const field = selectedTemplate.dynamic_fields?.find(f => f.id === fieldId);
      if (field) {
        result = result.replace(new RegExp(`{{${field.label}}}`, 'gi'), value);
      }
    });
    return result;
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowEditorModal(true);
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setShowEditorModal(true);
  };

  const handleSaveTemplate = () => {
    if (!sourceProject || !templateName) {
      toast.error('Please fill in all fields');
      return;
    }
    saveTemplateMutation.mutate({
      projectId: sourceProject,
      templateName,
      category: templateCategory,
    });
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#fffbf6",
      fontFamily: "'Montserrat', system-ui, sans-serif",
      WebkitFontSmoothing: "antialiased",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .fade-in { animation: fadeIn 0.3s ease both; }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(34,57,71,0.1); }
      `}</style>

      {/* BROWSE VIEW */}
      {view === "browse" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }} className="fade-up">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
              fontSize: 24, color: "#223947", marginBottom: 4,
            }}>
              Project Templates
            </h1>
            <p style={{ fontSize: 13, color: "#805c5c", lineHeight: 1.5 }}>
              Jump-start your next project with a proven structure. Every task comes pre-loaded with STEP values.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{
              flex: 1, minWidth: "100%", display: "flex", alignItems: "center", gap: 8,
              background: "white", border: "1px solid rgba(34,57,71,0.1)",
              borderRadius: 10, padding: "0 14px", height: 42,
            }}>
              <Search className="w-4 h-4" style={{ color: "#805c5c", flexShrink: 0 }} />
              <input
                type="text" placeholder="Search templates..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none", outline: "none", background: "transparent",
                  fontSize: 13, color: "#323232", width: "100%",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <button
                onClick={handleCreateNewTemplate}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "0 16px", height: 42, borderRadius: 10, flex: 1,
                  border: "none", background: "#223947", color: "#fffbf6",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span style={{ display: "none" }}>New Template</span>
                <span>New</span>
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "0 16px", height: 42, borderRadius: 10, flex: 1,
                  border: "1px solid rgba(34,57,71,0.15)", background: "white",
                  fontSize: 13, fontWeight: 600, color: "#223947", cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "6px 16px", borderRadius: 20, border: "none",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: activeCategory === cat ? "#223947" : "white",
                  color: activeCategory === cat ? "#fffbf6" : "#805c5c",
                  boxShadow: activeCategory === cat ? "0 2px 8px rgba(34,57,71,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}>
            {filtered.map((t, i) => {
              const TemplateIcon = t.icon;
              return (
                <div
                  key={t.id} className="card-hover fade-up"
                  style={{
                    background: "white", borderRadius: 14, padding: 24,
                    border: "1px solid rgba(34,57,71,0.08)",
                    cursor: "pointer", animationDelay: `${i * 0.06}s`,
                    position: "relative", overflow: "hidden",
                  }}
                  onClick={() => openPreview(t)}
                >
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: t.color,
                  }} />

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${t.color}12`, display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <TemplateIcon className="w-5 h-5" style={{ color: t.color }} />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "3px 10px",
                      borderRadius: 20, background: `${t.color}10`, color: t.color,
                      textTransform: "capitalize",
                    }}>
                      {t.category}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700, fontSize: 17, color: "#223947", marginBottom: 6,
                  }}>
                    {t.name}
                  </h3>
                  <p style={{
                    fontSize: 12, color: "#805c5c", lineHeight: 1.5, marginBottom: 16,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {t.description}
                  </p>

                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#999" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock className="w-3 h-3" /> {t.duration}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle className="w-3 h-3" /> {t.taskCount} tasks
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Layers className="w-3 h-3" /> {t.milestoneCount} milestones
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PREVIEW VIEW */}
      {view === "preview" && selectedTemplate && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }} className="fade-up">
          <button
            onClick={() => setView("browse")}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "none",
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
              color: "#805c5c", marginBottom: 24, padding: 0,
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Templates
          </button>

          <div style={{
            background: "white", borderRadius: 16, padding: 32,
            border: "1px solid rgba(34,57,71,0.08)",
            marginBottom: 24, position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: selectedTemplate.color,
            }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${selectedTemplate.color}12`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <selectedTemplate.icon className="w-6 h-6" style={{ color: selectedTemplate.color }} />
                  </div>
                  <div>
                    <h1 style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 800, fontSize: 24, color: "#223947", lineHeight: 1.2,
                    }}>
                      {selectedTemplate.name}
                    </h1>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: selectedTemplate.color,
                      textTransform: "capitalize",
                    }}>
                      {selectedTemplate.category}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#805c5c", lineHeight: 1.6, maxWidth: 520 }}>
                  {selectedTemplate.description}
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleEditTemplate(selectedTemplate)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 20px", borderRadius: 10,
                    border: "1px solid rgba(34,57,71,0.2)", background: "white",
                    fontSize: 13, fontWeight: 600, color: "#223947", cursor: "pointer",
                    fontFamily: "'Montserrat', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                >
                  Edit Template
                </button>
                <button
                  onClick={() => setView("newProject")}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 28px", borderRadius: 10, border: "none",
                    background: "#223947", color: "#fffbf6", fontSize: 14,
                    fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    boxShadow: "0 2px 12px rgba(34,57,71,0.25)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Plus className="w-4 h-4" /> Use This Template
                </button>
              </div>
            </div>

            <div style={{
              display: "flex", gap: 24, marginTop: 20, paddingTop: 20,
              borderTop: "1px solid rgba(34,57,71,0.06)",
            }}>
              {[
                { icon: Clock, label: "Duration", value: selectedTemplate.duration },
                { icon: CheckCircle, label: "Tasks", value: selectedTemplate.taskCount },
                { icon: Layers, label: "Milestones", value: selectedTemplate.milestoneCount },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <s.icon className="w-4 h-4" style={{ color: "#805c5c" }} />
                  <div>
                    <div style={{ fontSize: 10, color: "#999", fontWeight: 500 }}>{s.label}</div>
                    <div style={{ fontSize: 14, color: "#223947", fontWeight: 700 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedTemplate.milestones?.map((m, mi) => (
              <div key={mi} style={{
                background: "white", borderRadius: 14,
                border: "1px solid rgba(34,57,71,0.08)",
                overflow: "hidden",
              }} className="fade-up" >
                <button
                  onClick={() => setExpandedMilestone(expandedMilestone === mi ? null : mi)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "16px 20px", border: "none", cursor: "pointer",
                    background: expandedMilestone === mi ? `${selectedTemplate.color}08` : "transparent",
                    transition: "background 0.15s ease", textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${selectedTemplate.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: selectedTemplate.color,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      {mi + 1}
                    </div>
                    <div>
                      <div style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700, fontSize: 14, color: "#223947",
                      }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#999", fontWeight: 500 }}>
                        {m.week} · {m.tasks?.length || 0} tasks
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{
                    color: "#805c5c",
                    transform: expandedMilestone === mi ? "rotate(90deg)" : "rotate(0)",
                    transition: "transform 0.2s ease",
                  }} />
                </button>

                {expandedMilestone === mi && (
                  <div style={{ padding: "0 20px 16px" }} className="fade-in">
                    {m.tasks?.map((task, ti) => (
                      <div key={ti} style={{
                        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: ti < m.tasks.length - 1 ? "1px solid rgba(34,57,71,0.05)" : "none",
                        gap: 12, flexWrap: "wrap",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            border: "2px solid rgba(34,57,71,0.15)",
                          }} />
                          <span style={{ fontSize: 13, color: "#323232", fontWeight: 500 }}>
                            {task.title}
                          </span>
                        </div>
                        {task.step && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <StepBadge label="S" value={task.step.s} color={selectedTemplate.color} />
                            <StepBadge label="T" value={task.step.t} color="#805c5c" />
                            <StepBadge label="E" value={task.step.e} color="#5b8a72" />
                            <StepBadge label="P" value={task.step.p} color="#223947" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW PROJECT FLOW */}
      {view === "newProject" && selectedTemplate && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }} className="fade-up">
          <button
            onClick={() => setView("preview")}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "none",
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
              color: "#805c5c", marginBottom: 24, padding: 0,
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Preview
          </button>

          <div style={{
            background: "white", borderRadius: 16, padding: 32,
            border: "1px solid rgba(34,57,71,0.08)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${selectedTemplate.color}12`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <selectedTemplate.icon className="w-5 h-5" style={{ color: selectedTemplate.color }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#999", fontWeight: 500 }}>Creating project from</div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700, fontSize: 16, color: "#223947",
                }}>
                  {selectedTemplate.name}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#223947", marginBottom: 6, display: "block" }}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid rgba(34,57,71,0.15)", fontSize: 14,
                    color: "#323232", outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#223947", marginBottom: 6, display: "block" }}>
                  Assign to Venture
                </label>
                <select
                  value={selectedVenture}
                  onChange={(e) => setSelectedVenture(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid rgba(34,57,71,0.15)", fontSize: 14,
                    color: "#323232", background: "white", outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="">Select a venture...</option>
                  {ventures.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#223947", marginBottom: 6, display: "block" }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid rgba(34,57,71,0.15)", fontSize: 14,
                    color: "#323232", outline: "none",
                  }}
                />
                <p style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                  Task due dates will be calculated relative to this start date.
                </p>
              </div>

              {/* Dynamic Fields */}
              {selectedTemplate.dynamic_fields?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <DynamicFieldsForm
                    fields={selectedTemplate.dynamic_fields}
                    values={dynamicFieldValues}
                    onChange={setDynamicFieldValues}
                  />
                  <p style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
                    Use {`{{Field Name}}`} in task titles/descriptions to insert these values
                  </p>
                </div>
              )}

              <div style={{
                background: "#fffbf6", borderRadius: 10, padding: 16,
                border: "1px solid rgba(34,57,71,0.06)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#805c5c", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  What you'll get
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectedTemplate.milestones?.map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#323232" }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        background: `${selectedTemplate.color}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 700, color: selectedTemplate.color,
                      }}>
                        {i + 1}
                      </div>
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                      <span style={{ color: "#999", marginLeft: "auto" }}>{m.tasks?.length || 0} tasks</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateProject}
                disabled={createProjectMutation.isPending}
                style={{
                  width: "100%", padding: "14px", borderRadius: 10, border: "none",
                  background: "#223947", color: "#fffbf6", fontSize: 15,
                  fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 2px 12px rgba(34,57,71,0.25)",
                  transition: "all 0.15s ease",
                  opacity: createProjectMutation.isPending ? 0.6 : 1,
                }}
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE AS TEMPLATE MODAL */}
      {showSaveModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(34,57,71,0.4)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 200, padding: 20,
        }} className="fade-in" onClick={() => setShowSaveModal(false)}>
          <div
            style={{
              background: "white", borderRadius: 18, padding: 32, maxWidth: 480,
              width: "100%", boxShadow: "0 20px 60px rgba(34,57,71,0.2)",
            }}
            onClick={e => e.stopPropagation()}
            className="fade-up"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: "#223947",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bookmark className="w-5 h-5" style={{ color: "#fffbf6" }} />
              </div>
              <div>
                <h2 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800, fontSize: 18, color: "#223947",
                }}>
                  Save as Template
                </h2>
                <p style={{ fontSize: 12, color: "#805c5c" }}>
                  Snapshot an existing project's structure
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#223947", marginBottom: 6, display: "block" }}>
                  Source Project
                </label>
                <select
                  value={sourceProject}
                  onChange={(e) => setSourceProject(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid rgba(34,57,71,0.15)", fontSize: 13,
                    color: "#323232", background: "white", cursor: "pointer",
                  }}
                >
                  <option value="">Select a project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#223947", marginBottom: 6, display: "block" }}>
                  Template Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., My Website Launch Process"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid rgba(34,57,71,0.15)", fontSize: 13,
                    color: "#323232",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#223947", marginBottom: 6, display: "block" }}>
                  Category
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid rgba(34,57,71,0.15)", fontSize: 13,
                    color: "#323232", background: "white", cursor: "pointer",
                  }}
                >
                  {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <p style={{
                fontSize: 11, color: "#999", lineHeight: 1.5,
                padding: "10px 14px", background: "#fffbf6", borderRadius: 8,
              }}>
                This will save the project's tasks, descriptions, and STEP values as a reusable template.
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowSaveModal(false)}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 10,
                    border: "1px solid rgba(34,57,71,0.15)", background: "white",
                    fontSize: 13, fontWeight: 600, color: "#805c5c", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saveTemplateMutation.isPending}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 10, border: "none",
                    background: "#223947", color: "#fffbf6",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    opacity: saveTemplateMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      <TemplateEditorModal
        template={editingTemplate}
        isOpen={showEditorModal}
        onClose={() => {
          setShowEditorModal(false);
          setEditingTemplate(null);
        }}
      />
    </div>
  );
}