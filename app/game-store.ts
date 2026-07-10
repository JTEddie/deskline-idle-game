"use client";

import { create } from "zustand";
import { ACTIONS, type ResourceKey, type SkillKey } from "./game-config";

type Skill = { level: number; xp: number };
type GameState = {
  resources: Record<ResourceKey, number>;
  skills: Record<SkillKey, Skill>;
  facilities: Record<string, number>;
  activeAction: SkillKey;
  running: boolean;
  progress: number;
  completedRuns: number;
  totalOnline: number;
  sessionOnline: number;
  sessionEarned: Partial<Record<ResourceKey, number>>;
  theme: "light" | "dark";
  sound: boolean;
  logs: string[];
  hydrated: boolean;
  hydrate: () => void;
  selectAction: (id: SkillKey) => void;
  toggleRunning: () => void;
  tick: (seconds: number) => void;
  buyUpgrade: (id: string, resource: ResourceKey, cost: number) => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  manualSave: () => void;
  importSave: (raw: string) => boolean;
  reset: () => void;
};

const initial = {
  resources: { parts: 0, circuits: 0, batteries: 0, credits: 60, research: 8 },
  skills: { assembly: { level: 1, xp: 0 }, testing: { level: 1, xp: 0 }, packing: { level: 1, xp: 0 } },
  facilities: { workbench: 0, storage: 0, optimizer: 0, autoRunner: 0 },
  activeAction: "assembly" as SkillKey,
  running: true,
  progress: 0,
  completedRuns: 0,
  totalOnline: 0,
  sessionOnline: 0,
  sessionEarned: {},
  theme: "light" as const,
  sound: false,
  logs: ["生产线已就绪。网页关闭时，所有进度都会停止。"],
  hydrated: false,
};

const SAVE_KEY = "deskline-save-v1";
const snapshot = (s: GameState) => ({
  version: 1,
  resources: s.resources,
  skills: s.skills,
  facilities: s.facilities,
  activeAction: s.activeAction,
  completedRuns: s.completedRuns,
  totalOnline: s.totalOnline,
  theme: s.theme,
  sound: s.sound,
  logs: s.logs.slice(0, 12),
});

export const useGameStore = create<GameState>((set, get) => ({
  ...initial,
  hydrate: () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (parsed?.version === 1) set({ ...parsed, running: true, progress: 0, sessionOnline: 0, sessionEarned: {}, hydrated: true });
      else set({ hydrated: true });
    } catch { set({ hydrated: true }); }
  },
  selectAction: (activeAction) => set({ activeAction, progress: 0, running: true, logs: [`已切换：${ACTIONS.find(a => a.id === activeAction)?.label}`, ...get().logs].slice(0, 12) }),
  toggleRunning: () => set(s => ({ running: !s.running, logs: [s.running ? "生产线已暂停。" : "生产线继续运转。", ...s.logs].slice(0, 12) })),
  tick: (seconds) => set(s => {
    if (!s.hydrated) return s;
    const totalOnline = s.totalOnline + seconds;
    const sessionOnline = s.sessionOnline + seconds;
    if (!s.running) return { totalOnline, sessionOnline };
    const action = ACTIONS.find(a => a.id === s.activeAction)!;
    const speed = Math.max(.55, 1 - s.facilities.optimizer * .06);
    const duration = action.duration * speed;
    let progress = s.progress + seconds / duration;
    if (progress < 1) return { progress, totalOnline, sessionOnline };
    const cycles = Math.min(20, Math.floor(progress));
    progress -= cycles;
    const cost = "cost" in action ? action.cost : undefined;
    const possible = cost ? Math.min(cycles, ...Object.entries(cost).map(([k, v]) => Math.floor(s.resources[k as ResourceKey] / v))) : cycles;
    if (possible <= 0) return { progress: 0, running: false, totalOnline, sessionOnline, logs: ["材料不足，生产线已自动暂停。", ...s.logs].slice(0, 12) };
    const mult = (1 + s.facilities.workbench * .2) * (1 + (s.skills[s.activeAction].level - 1) * .08);
    const resources = { ...s.resources };
    if (cost) Object.entries(cost).forEach(([k, v]) => resources[k as ResourceKey] -= v * possible);
    const earned = { ...s.sessionEarned };
    Object.entries(action.output).forEach(([k, v]) => {
      const amount = Math.max(1, Math.floor(v * mult * possible));
      const cap = 500 + s.facilities.storage * 250;
      resources[k as ResourceKey] = Math.min(k === "credits" ? 999999 : cap, resources[k as ResourceKey] + amount);
      earned[k as ResourceKey] = (earned[k as ResourceKey] || 0) + amount;
    });
    const skills = { ...s.skills, [s.activeAction]: { ...s.skills[s.activeAction] } };
    const skill = skills[s.activeAction];
    skill.xp += action.xp * possible;
    let leveled = false;
    while (skill.xp >= skill.level * 40) { skill.xp -= skill.level * 40; skill.level++; leveled = true; }
    const auto = s.facilities.autoRunner > 0;
    return {
      resources, skills, progress: auto ? progress : 0, running: auto, totalOnline, sessionOnline,
      completedRuns: s.completedRuns + possible, sessionEarned: earned,
      logs: [leveled ? `${action.label}提升到 ${skill.level} 级。` : `${action.label}完成 ×${possible}`, ...s.logs].slice(0, 12),
    };
  }),
  buyUpgrade: (id, resource, cost) => set(s => {
    if (s.resources[resource] < cost) return s;
    return { resources: { ...s.resources, [resource]: s.resources[resource] - cost }, facilities: { ...s.facilities, [id]: (s.facilities[id] || 0) + 1 }, logs: [`设施升级完成：${id}`, ...s.logs].slice(0, 12) };
  }),
  toggleTheme: () => set(s => ({ theme: s.theme === "light" ? "dark" : "light" })),
  toggleSound: () => set(s => ({ sound: !s.sound })),
  manualSave: () => { localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot(get()))); set(s => ({ logs: ["存档已保存。", ...s.logs].slice(0, 12) })); },
  importSave: (raw) => { try { const data = JSON.parse(raw); if (data.version !== 1) return false; set({ ...data, running: false, progress: 0, hydrated: true }); localStorage.setItem(SAVE_KEY, raw); return true; } catch { return false; } },
  reset: () => { localStorage.removeItem(SAVE_KEY); set({ ...initial, hydrated: true }); },
}));

export const saveGame = () => localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot(useGameStore.getState())));
