export type ResourceKey = "parts" | "circuits" | "batteries" | "credits" | "research";
export type SkillKey = "assembly" | "testing" | "packing";

export const RESOURCES: Record<ResourceKey, { label: string; icon: string }> = {
  parts: { label: "零件", icon: "⚙" },
  circuits: { label: "电路板", icon: "▦" },
  batteries: { label: "电池", icon: "▰" },
  credits: { label: "工分", icon: "◆" },
  research: { label: "研究点", icon: "✦" },
};

export const ACTIONS = [
  { id: "assembly", label: "组装基础零件", subtitle: "稳定产出 · 适合起步", icon: "Wrench", duration: 5, output: { parts: 3 }, xp: 5, unlock: 1 },
  { id: "testing", label: "测试电路模块", subtitle: "精密作业 · 产出电路板", icon: "CircuitBoard", duration: 8, output: { circuits: 2 }, xp: 8, unlock: 2 },
  { id: "packing", label: "处理交付订单", subtitle: "消耗零件 · 换取工分", icon: "PackageCheck", duration: 10, output: { credits: 14, research: 1 }, cost: { parts: 5 }, xp: 10, unlock: 3 },
] as const;

export const UPGRADES = [
  { id: "workbench", label: "精密工作台", icon: "Wrench", description: "所有行动产量 +20%", base: 35, resource: "credits", max: 8 },
  { id: "storage", label: "分类仓储架", icon: "Archive", description: "资源容量 +250", base: 24, resource: "credits", max: 6 },
  { id: "optimizer", label: "流程优化器", icon: "Gauge", description: "行动耗时 -6%", base: 45, resource: "research", max: 5 },
  { id: "autoRunner", label: "自动续作模块", icon: "Bot", description: "完成后自动开始下一轮", base: 90, resource: "credits", max: 1 },
] as const;

export const TASKS = [
  { id: "first", label: "收集 30 个零件", target: 30, kind: "parts" },
  { id: "runs", label: "完成 15 次行动", target: 15, kind: "runs" },
  { id: "level", label: "任一技能达到 3 级", target: 3, kind: "level" },
  { id: "upgrade", label: "购买 2 次设施升级", target: 2, kind: "upgrades" },
  { id: "online", label: "保持运行 10 分钟", target: 600, kind: "online" },
] as const;
