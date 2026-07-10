"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, BarChart3, Bot, CheckCircle2, ChevronRight, CirclePause, CirclePlay, ClipboardCheck, Download, Gauge, LayoutDashboard, ListTodo, Moon, PackageCheck, RotateCcw, Save, Settings, Sun, Trophy, Upload, Volume2, VolumeX, Wrench, CircuitBoard } from "lucide-react";
import { ACTIONS, RESOURCES, TASKS, UPGRADES, type ResourceKey, type SkillKey } from "../game-config";
import { saveGame, useGameStore } from "../game-store";

const icons = { Wrench, CircuitBoard, PackageCheck, Archive, Gauge, Bot };
const compact = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : Math.floor(n).toString();
const clock = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s % 3600 / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function DesklineGame() {
  const game = useGameStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const current = ACTIONS.find(a => a.id === game.activeAction)!;
  const skill = game.skills[game.activeAction];
  const duration = current.duration * Math.max(.55, 1 - game.facilities.optimizer * .06);
  const multiplier = (1 + game.facilities.workbench * .2) * (1 + (skill.level - 1) * .08);

  useEffect(() => {
    game.hydrate();
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(30, Math.max(0, (now - last) / 1000));
      last = now;
      useGameStore.getState().tick(delta);
    }, 250);
    const autosave = window.setInterval(() => { saveGame(); setSavedFlash(true); window.setTimeout(() => setSavedFlash(false), 1200); }, 15000);
    const before = () => saveGame();
    window.addEventListener("beforeunload", before);
    return () => { clearInterval(id); clearInterval(autosave); window.removeEventListener("beforeunload", before); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { document.documentElement.dataset.theme = game.theme; }, [game.theme]);

  const taskProgress = useMemo(() => TASKS.map(t => {
    const value = t.kind === "parts" ? game.resources.parts : t.kind === "runs" ? game.completedRuns : t.kind === "level" ? Math.max(...Object.values(game.skills).map(s => s.level)) : t.kind === "upgrades" ? Object.values(game.facilities).reduce((a, b) => a + b, 0) : game.totalOnline;
    return { ...t, value, done: value >= t.target };
  }), [game]);

  if (!game.hydrated) return <main className="loading">正在启动桌面生产线…</main>;

  const downloadSave = () => {
    saveGame();
    const blob = new Blob([localStorage.getItem("deskline-save-v1") || "{}"], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "deskline-save.json"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">D</span><div><strong>Deskline</strong><span>桌面生产线</span></div></div>
        <div className="status-strip"><span className={`live-dot ${game.running ? "" : "paused"}`} />{game.running ? "运行中" : "已暂停"}<span className="divider" />本次运行 <b>{clock(game.sessionOnline)}</b><span className="divider" /><span className={savedFlash ? "saved active" : "saved"}><Save size={14} />{savedFlash ? "刚刚保存" : "自动保存"}</span></div>
        <div className="top-actions"><button aria-label="切换主题" onClick={game.toggleTheme}>{game.theme === "light" ? <Moon /> : <Sun />}</button><button aria-label="声音开关" onClick={game.toggleSound}>{game.sound ? <Volume2 /> : <VolumeX />}</button><button className="pause-btn" onClick={game.toggleRunning}>{game.running ? <CirclePause /> : <CirclePlay />}{game.running ? "暂停" : "继续"}</button></div>
      </header>

      <aside className="sidebar">
        <nav>
          <a className="active" href="#overview"><LayoutDashboard />总览</a><a href="#actions"><BarChart3 />行动</a><a href="#upgrades"><Wrench />升级</a><a href="#tasks"><ListTodo />任务</a><a href="#achievements"><Trophy />成就</a><a href="#settings"><Settings />设置</a>
        </nav>
        <div className="sidebar-note"><span>仅在线运行</span><p>关闭网页后不会产生任何资源，也不会补算进度。</p></div>
      </aside>

      <section className="workspace" id="overview">
        <div className="section-head"><div><p className="eyebrow">当前工作单</p><h1>{current.label}</h1></div><div className="rate"><span>预计效率</span><strong>{compact((Object.values(current.output)[0] * multiplier / duration) * 60)} / 分钟</strong></div></div>
        <article className="current-card">
          <div className="current-main"><div className="action-icon">{(() => { const Icon = icons[current.icon]; return <Icon />; })()}</div><div className="current-copy"><div className="action-title"><h2>{current.label}</h2><span>Lv.{skill.level}</span></div><p>{current.subtitle}</p><div className="progress-meta"><span>本轮进度</span><b>{Math.floor(game.progress * 100)}%</b></div><div className="progress"><i style={{ width: `${Math.min(100, game.progress * 100)}%` }} /></div><div className="cycle-stats"><span>剩余 <b>{Math.max(0, duration * (1 - game.progress)).toFixed(1)} 秒</b></span><span>每轮产出 <b>{Object.entries(current.output).map(([k, v]) => `${RESOURCES[k as ResourceKey].icon} ${Math.floor(v * multiplier)}`).join(" · ")}</b></span><span>熟练度 <b>{skill.xp} / {skill.level * 40}</b></span></div></div></div>
          <button className={game.running ? "stop" : "start"} onClick={game.toggleRunning}>{game.running ? <CirclePause /> : <CirclePlay />}{game.running ? "停止行动" : "开始行动"}</button>
        </article>

        <div className="metric-grid"><div><span>本次累计产出</span><strong>{Object.values(game.sessionEarned).reduce((a, b) => a + (b || 0), 0).toFixed(0)}</strong><small>跨全部资源</small></div><div><span>总行动完成</span><strong>{game.completedRuns}</strong><small>本地永久记录</small></div><div><span>全局效率</span><strong>+{Math.round((multiplier - 1) * 100)}%</strong><small>设施与熟练度</small></div><div><span>下一里程碑</span><strong>{Math.max(0, 90 - Math.floor(game.sessionOnline / 60))}m</strong><small>自动化模块建议</small></div></div>

        <section id="actions"><div className="panel-head"><div><p className="eyebrow">切换生产线</p><h2>可选行动</h2></div><span>同一时间仅运行一项</span></div><div className="action-list">{ACTIONS.map(action => { const Icon = icons[action.icon]; const locked = game.skills.assembly.level < action.unlock; return <button key={action.id} disabled={locked} className={game.activeAction === action.id ? "selected" : ""} onClick={() => game.selectAction(action.id as SkillKey)}><Icon /><div><strong>{action.label}</strong><span>{locked ? `组装达到 Lv.${action.unlock} 解锁` : `${action.duration} 秒 / 轮`}</span></div><em>Lv.{game.skills[action.id].level}</em><ChevronRight /></button>; })}</div></section>
      </section>

      <aside className="right-rail">
        <section className="rail-panel resources"><div className="panel-head"><div><p className="eyebrow">实时库存</p><h2>资源</h2></div><span>{500 + game.facilities.storage * 250} 容量</span></div>{Object.entries(RESOURCES).map(([key, value]) => <div className="resource-row" key={key}><span className="resource-icon">{value.icon}</span><div><span>{value.label}</span><strong>{compact(game.resources[key as ResourceKey])}</strong></div><small>+{compact(game.sessionEarned[key as ResourceKey] || 0)}</small></div>)}</section>

        <section className="rail-panel" id="upgrades"><div className="panel-head"><div><p className="eyebrow">可立即购买</p><h2>设施升级</h2></div></div><div className="upgrade-list">{UPGRADES.map(u => { const level = game.facilities[u.id] || 0; const cost = Math.ceil(u.base * Math.pow(1.72, level)); const Icon = icons[u.icon]; const key = u.resource as ResourceKey; return <button key={u.id} disabled={level >= u.max || game.resources[key] < cost} onClick={() => game.buyUpgrade(u.id, key, cost)}><Icon /><div><strong>{u.label}<span>Lv.{level}</span></strong><small>{u.description}</small><em>{level >= u.max ? "已满级" : `${RESOURCES[key].icon} ${cost}`}</em></div></button>; })}</div></section>

        <section className="rail-panel" id="tasks"><div className="panel-head"><div><p className="eyebrow">当前阶段</p><h2>任务清单</h2></div><span>{taskProgress.filter(t => t.done).length}/{TASKS.length}</span></div><div className="task-list">{taskProgress.map(t => <div key={t.id} className={t.done ? "done" : ""}><CheckCircle2 /><div><span>{t.label}</span><i><b style={{ width: `${Math.min(100, t.value / t.target * 100)}%` }} /></i><small>{Math.floor(t.value)} / {t.target}</small></div></div>)}</div></section>

        <section className="rail-panel log"><div className="panel-head"><div><p className="eyebrow">最近动态</p><h2>运行日志</h2></div></div>{game.logs.slice(0, 4).map((l, i) => <p key={`${l}-${i}`}><span />{l}</p>)}</section>

        <section className="rail-panel save-panel" id="settings"><div className="panel-head"><div><p className="eyebrow">本地数据</p><h2>存档管理</h2></div></div><div className="save-actions"><button onClick={game.manualSave}><Save />保存</button><button onClick={downloadSave}><Download />导出</button><button onClick={() => fileRef.current?.click()}><Upload />导入</button><button className="danger" onClick={() => { if (confirm("确定清空全部 Deskline 存档吗？此操作不可撤销。")) game.reset(); }}><RotateCcw />重置</button></div><input ref={fileRef} hidden type="file" accept="application/json" onChange={async e => { const f = e.target.files?.[0]; if (f && !game.importSave(await f.text())) alert("存档格式无效。"); }} /></section>
      </aside>
    </main>
  );
}
