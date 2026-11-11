import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast as sonnerToast } from 'sonner';
import {
  User, Mail, Target, Clock, BookOpen, Briefcase, Zap, TrendingUp, Award,
  Shield, Edit2, GraduationCap, Building2, Heart, Star, AlertTriangle, Languages
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/** Extracts initials for the avatar. */
function initials(name = "") {
  return (
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "U"
  );
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function InfoItem({ icon: Icon, label, value, tone = "text-primary" }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={cn("mt-0.5 shrink-0", tone)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-sm leading-snug text-foreground whitespace-pre-line">{value || "Not specified"}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { userProfile, setUserProfile, tracks } = useApp();
  
  // Active track info
  const trackIds = Object.keys(tracks);
  let totalTopics = 0;
  let completedTopics = 0;
  trackIds.forEach(tId => {
    const nodeMap = tracks[tId]?.nodeMap || {};
    Object.values(nodeMap).forEach(node => {
      totalTopics++;
      if (node.status === 'completed') completedTopics++;
    });
  });

  // Edit States
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingLearner, setIsEditingLearner] = useState(false);

  // Form State: Personal
  const [personalForm, setPersonalForm] = useState({
    name: userProfile.name || '',
    email: userProfile.email || '',
  });

  // Form State: Learner
  const dc = userProfile.detailedContext || {};
  const [learnerForm, setLearnerForm] = useState({
    targetRole: userProfile.targetRole || '',
    careerGoals: userProfile.careerGoals || '',
    dreamCompany: dc.dreamCompany || '',
    motivation: dc.motivation || '',
    education: dc.education || '',
    pastExperience: userProfile.pastExperience || '',
    strengths: dc.strengths || '',
    weaknesses: dc.weaknesses || '',
    preferredLanguages: (dc.preferredLanguages || []).join(', '),
    weeklyTimeHours: userProfile.weeklyTimeHours || 6,
    learningStyle: userProfile.learningStyle || 'project-first',
  });

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingLearner, setSavingLearner] = useState(false);

  // Sync forms if userProfile updates asynchronously (e.g. after backend fetch)
  useEffect(() => {
    if (!isEditingPersonal) {
      setPersonalForm({
        name: userProfile.name || '',
        email: userProfile.email || '',
      });
    }
  }, [userProfile.name, userProfile.email, isEditingPersonal]);

  useEffect(() => {
    if (!isEditingLearner) {
      const dctx = userProfile.detailedContext || {};
      setLearnerForm({
        targetRole: userProfile.targetRole || '',
        careerGoals: userProfile.careerGoals || '',
        dreamCompany: dctx.dreamCompany || '',
        motivation: dctx.motivation || '',
        education: dctx.education || '',
        pastExperience: userProfile.pastExperience || '',
        strengths: dctx.strengths || '',
        weaknesses: dctx.weaknesses || '',
        preferredLanguages: (dctx.preferredLanguages || []).join(', '),
        weeklyTimeHours: userProfile.weeklyTimeHours || 6,
        learningStyle: userProfile.learningStyle || 'project-first',
      });
    }
  }, [userProfile, isEditingLearner]);

  const handleSavePersonal = async () => {
    const payload = {
      name: personalForm.name,
      email: personalForm.email,
    };
    setSavingPersonal(true);
    try {
      const res = await api.updateUserProfile(payload);
      if (res?.success && res.profile) {
        setUserProfile(res.profile);
      } else {
        setUserProfile(prev => ({ ...prev, ...payload }));
      }
      sonnerToast.success('Personal info updated');
      setIsEditingPersonal(false);
    } catch (err) {
      sonnerToast.error('Failed to update personal info', {
        description: err.message || 'Please try again.',
      });
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleCancelPersonal = () => {
    setPersonalForm({ name: userProfile.name, email: userProfile.email });
    setIsEditingPersonal(false);
  };

  const handleSaveLearner = async () => {
    const updatedContext = {
      ...(userProfile.detailedContext || {}),
      dreamCompany: learnerForm.dreamCompany,
      motivation: learnerForm.motivation,
      education: learnerForm.education,
      strengths: learnerForm.strengths,
      weaknesses: learnerForm.weaknesses,
      preferredLanguages: learnerForm.preferredLanguages.split(',').map(s => s.trim()).filter(Boolean),
    };
    const payload = {
      targetRole: learnerForm.targetRole,
      careerGoals: learnerForm.careerGoals,
      pastExperience: learnerForm.pastExperience,
      weeklyTimeHours: Number(learnerForm.weeklyTimeHours) || 6,
      learningStyle: learnerForm.learningStyle,
      detailedContext: updatedContext,
    };
    setSavingLearner(true);
    try {
      const res = await api.updateUserProfile(payload);
      if (res?.success && res.profile) {
        setUserProfile(res.profile);
      } else {
        setUserProfile(prev => ({ ...prev, ...payload }));
      }
      sonnerToast.success('Learner context saved');
      setIsEditingLearner(false);
    } catch (err) {
      sonnerToast.error('Failed to update learner context', {
        description: err.message || 'Please try again.',
      });
    } finally {
      setSavingLearner(false);
    }
  };

  const handleCancelLearner = () => {
    const dctx = userProfile.detailedContext || {};
    setLearnerForm({
      targetRole: userProfile.targetRole || '',
      careerGoals: userProfile.careerGoals || '',
      dreamCompany: dctx.dreamCompany || '',
      motivation: dctx.motivation || '',
      education: dctx.education || '',
      pastExperience: userProfile.pastExperience || '',
      strengths: dctx.strengths || '',
      weaknesses: dctx.weaknesses || '',
      preferredLanguages: (dctx.preferredLanguages || []).join(', '),
      weeklyTimeHours: userProfile.weeklyTimeHours || 6,
      learningStyle: userProfile.learningStyle || 'project-first',
    });
    setIsEditingLearner(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your identity and adaptive learning context</p>
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Column: Personal Profile */}
        <motion.div variants={fadeUp} className="space-y-6 lg:col-span-4">
          <Card className="flex flex-col border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-4 flex-row justify-between items-start">
              <CardTitle className="text-base font-semibold">Personal Info</CardTitle>
              {!isEditingPersonal && (
                <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground" onClick={() => setIsEditingPersonal(true)}>
                  <Edit2 className="size-3.5 mr-1.5" /> Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center pb-6">
              <div className="relative mb-4">
                <div className="absolute -inset-1 rounded-full bg-primary/20 animate-pulse blur-sm" />
                <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#8b5cf6] font-mono text-2xl font-bold text-primary-foreground shadow-sm">
                  {initials(userProfile.name)}
                </div>
              </div>
              
              <div className="w-full">
                {isEditingPersonal ? (
                  <div className="space-y-3 animate-in fade-in text-left">
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Full Name</label>
                      <Input value={personalForm.name} onChange={(e) => setPersonalForm({...personalForm, name: e.target.value})} className="mt-1 h-9 text-sm transition-all focus-visible:ring-primary" />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Email Address</label>
                      <Input value={personalForm.email} onChange={(e) => setPersonalForm({...personalForm, email: e.target.value})} className="mt-1 h-9 text-sm transition-all focus-visible:ring-primary" />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3">
                      <Button onClick={handleCancelPersonal} size="sm" variant="outline" className="h-8" disabled={savingPersonal}>Cancel</Button>
                      <Button onClick={handleSavePersonal} size="sm" className="h-8" disabled={savingPersonal}>{savingPersonal ? 'Saving...' : 'Save'}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-foreground">{userProfile.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                      <Mail className="size-3.5" />
                      {userProfile.email}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>

            <Separator />
            
            <CardContent className="pt-5 pb-6 bg-secondary/10">
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Platform Stats</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-border/50 bg-card p-3 text-center shadow-sm">
                  <div className="mx-auto flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary mb-2"><Zap className="size-3.5" /></div>
                  <div className="text-lg font-bold text-foreground">{userProfile.stats?.xp || 0}</div>
                  <div className="text-[10px] font-medium uppercase text-muted-foreground">Total XP</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-card p-3 text-center shadow-sm">
                  <div className="mx-auto flex size-7 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 mb-2"><TrendingUp className="size-3.5" /></div>
                  <div className="text-lg font-bold text-foreground">{userProfile.stats?.streak || 0}</div>
                  <div className="text-[10px] font-medium uppercase text-muted-foreground">Day Streak</div>
                </div>
              </div>
              
              <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Award className="size-3.5 text-blue-500"/> Modules Done</span>
                  <span className="text-sm font-bold">{completedTopics} / {totalTopics || '-'}</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: totalTopics ? `${(completedTopics/totalTopics)*100}%` : '0%' }}/>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Learner Profile */}
        <motion.div variants={fadeUp} className="space-y-6 lg:col-span-8">
          <Card className="flex flex-col border-border/50 bg-card shadow-sm h-full">
            <CardHeader className="flex-row items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="size-4" />
                </span>
                <div>
                  <CardTitle className="text-base font-semibold">Learner Context</CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="hidden sm:inline-flex bg-primary/10 text-primary border-transparent text-[10px] uppercase tracking-wide">
                  <Shield className="mr-1.5 size-3" /> Adaptive Engine Active
                </Badge>
                {!isEditingLearner ? (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setIsEditingLearner(true)}>
                    <Edit2 className="size-3.5 mr-1.5" /> Edit Details
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8" onClick={handleCancelLearner} disabled={savingLearner}>Cancel</Button>
                    <Button size="sm" className="h-8" onClick={handleSaveLearner} disabled={savingLearner}>{savingLearner ? 'Saving...' : 'Save Changes'}</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              
              {isEditingLearner ? (
                /* EDIT MODE */
                <div className="space-y-6 animate-in fade-in">
                  <div className="space-y-4">
                    <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Career & Ambition</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground">Target Role</label>
                        <Input value={learnerForm.targetRole} onChange={e => setLearnerForm({...learnerForm, targetRole: e.target.value})} className="mt-1 h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground">Dream Company</label>
                        <Input value={learnerForm.dreamCompany} onChange={e => setLearnerForm({...learnerForm, dreamCompany: e.target.value})} className="mt-1 h-9 text-sm" placeholder="e.g. Google, OpenAI..." />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-muted-foreground">Career Goals</label>
                        <textarea value={learnerForm.careerGoals} onChange={e => setLearnerForm({...learnerForm, careerGoals: e.target.value})} className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-muted-foreground">Core Motivation</label>
                        <textarea value={learnerForm.motivation} onChange={e => setLearnerForm({...learnerForm, motivation: e.target.value})} className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Background & Skills</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-muted-foreground">Past Experience</label>
                        <textarea value={learnerForm.pastExperience} onChange={e => setLearnerForm({...learnerForm, pastExperience: e.target.value})} className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-muted-foreground">Education</label>
                        <Input value={learnerForm.education} onChange={e => setLearnerForm({...learnerForm, education: e.target.value})} className="mt-1 h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground">Strengths (Current Skills)</label>
                        <textarea value={learnerForm.strengths} onChange={e => setLearnerForm({...learnerForm, strengths: e.target.value})} className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground">Weaknesses (Areas to Improve)</label>
                        <textarea value={learnerForm.weaknesses} onChange={e => setLearnerForm({...learnerForm, weaknesses: e.target.value})} className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-muted-foreground">Preferred Languages (comma separated)</label>
                        <Input value={learnerForm.preferredLanguages} onChange={e => setLearnerForm({...learnerForm, preferredLanguages: e.target.value})} className="mt-1 h-9 text-sm" placeholder="Python, JavaScript, Go..." />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Learning Configuration</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground">Weekly Time Budget (Hours)</label>
                        <Input type="number" min="1" max="100" value={learnerForm.weeklyTimeHours} onChange={e => setLearnerForm({...learnerForm, weeklyTimeHours: e.target.value})} className="mt-1 h-9 text-sm" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground">Learning Style</label>
                        <select 
                          value={learnerForm.learningStyle} 
                          onChange={e => setLearnerForm({...learnerForm, learningStyle: e.target.value})} 
                          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="project-first">Project First</option>
                          <option value="theory-first">Theory First</option>
                          <option value="visual">Visual Learner</option>
                          <option value="fast-paced">Fast Paced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* READ MODE */
                <div className="space-y-8">
                  {/* Category: Career & Ambition */}
                  <div>
                    <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Career & Ambition</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <InfoItem icon={Target} label="Target Role" value={userProfile.targetRole} tone="text-primary" />
                      <InfoItem icon={Building2} label="Dream Company" value={dc.dreamCompany} tone="text-emerald-500" />
                      <div className="sm:col-span-2 grid sm:grid-cols-2 gap-6">
                        <InfoItem icon={TrendingUp} label="Career Goals" value={userProfile.careerGoals} tone="text-blue-500" />
                        <InfoItem icon={Heart} label="Motivation" value={dc.motivation} tone="text-rose-500" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />

                  {/* Category: Background & Skills */}
                  <div>
                    <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Background & Skills</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2">
                        <InfoItem icon={Briefcase} label="Past Experience" value={userProfile.pastExperience} tone="text-orange-500" />
                      </div>
                      <div className="sm:col-span-2">
                        <InfoItem icon={GraduationCap} label="Education" value={dc.education} tone="text-primary" />
                      </div>
                      <InfoItem icon={Star} label="Strengths" value={dc.strengths} tone="text-amber-500" />
                      <InfoItem icon={AlertTriangle} label="Areas to Improve" value={dc.weaknesses} tone="text-warning" />
                      
                      {dc.preferredLanguages && dc.preferredLanguages.length > 0 && (
                        <div className="sm:col-span-2 flex items-start gap-2.5">
                          <span className="mt-0.5 shrink-0 text-muted-foreground"><Languages className="size-4" /></span>
                          <div className="min-w-0">
                            <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Preferred Languages</p>
                            <div className="flex flex-wrap gap-1.5">
                              {dc.preferredLanguages.map(lang => (
                                <Badge key={lang} variant="secondary" className="text-[10px] font-medium">{lang}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Category: Learning Preferences */}
                  <div>
                    <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Learning Configuration</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <InfoItem icon={Clock} label="Time Budget" value={userProfile.weeklyTimeHours ? `${userProfile.weeklyTimeHours} hours / week` : null} tone="text-green-500" />
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0 text-purple-500"><BookOpen className="size-4" /></span>
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Learning Style</p>
                          <Badge variant="outline" className="text-[11px] capitalize">📚 {userProfile.learningStyle?.replace('-', ' ')}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
