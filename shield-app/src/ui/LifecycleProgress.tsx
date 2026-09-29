import { useStore } from '../store/useStore';
import type { PageKey } from '../schema/types';

interface LifecycleProgressProps {
  activeStage: 1 | 2 | 3 | 4;
}

const STAGES: { stageNum: 1 | 2 | 3 | 4; key: PageKey; title: string; badge: string; question: string }[] = [
  {
    stageNum: 1,
    key: 'digital_eng',
    title: '01 Design & CAE Validation',
    badge: 'CAE',
    question: 'Can the structure safely carry the required design loads?',
  },
  {
    stageNum: 2,
    key: 'mfg_quality',
    title: '02 Manufacturing & Baseline',
    badge: 'MFG',
    question: 'Was the vehicle built correctly, and what is its healthy baseline?',
  },
  {
    stageNum: 3,
    key: 'controlled_val',
    title: '03 Vehicle Testing & Validation',
    badge: 'TEST',
    question: 'Does the physical vehicle behave as predicted?',
  },
  {
    stageNum: 4,
    key: 'live_twin',
    title: '04 Live Structural Health',
    badge: 'LIVE',
    question: 'Has the structure changed or degraded during operation?',
  },
];

export function LifecycleProgress({ activeStage }: LifecycleProgressProps) {
  const navigate = useStore((s) => s.navigate);
  const current = STAGES.find((s) => s.stageNum === activeStage) ?? STAGES[0];

  return (
    <div className="col gap-2 p-3 bg-slate-950/95 border border-slate-800 rounded-xl mb-3 shadow-xl font-mono text-xs text-slate-200">
      {/* 4-STAGE HORIZONTAL PROGRESS BAR */}
      <div className="spread flex-wrap gap-2 pb-2 border-b border-slate-800/80">
        <div className="row gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="tiny font-extrabold text-cyan-400 uppercase tracking-wider">ENGINEERING LIFECYCLE THREAD</span>
        </div>
        <div className="row flex-wrap gap-1 sm:gap-2">
          {STAGES.map((st, i) => {
            const isActive = st.stageNum === activeStage;
            const isCompleted = st.stageNum < activeStage;
            return (
              <div key={st.stageNum} className="row gap-1 items-center">
                <button
                  onClick={() => navigate(st.key)}
                  className={`row gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                      : isCompleted
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 hover:border-emerald-400'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px]">
                    {isCompleted ? '✓' : isActive ? '●' : '○'}
                  </span>
                  <span>{st.stageNum === 1 ? 'DESIGN' : st.stageNum === 2 ? 'BUILD' : st.stageNum === 3 ? 'VALIDATE' : 'MONITOR'}</span>
                  <span className={`px-1 rounded text-[9px] ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                    {st.badge}
                  </span>
                </button>
                {i < STAGES.length - 1 && <span className="text-slate-600 text-xs px-0.5">➔</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* PLAIN-LANGUAGE ENGINEERING QUESTION BANNER */}
      <div className="spread flex-wrap gap-2 pt-1">
        <div className="row gap-2 items-center">
          <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 uppercase tracking-wide">
            STAGE {current.stageNum} QUESTION
          </span>
          <span className="font-semibold text-slate-100 text-sm tracking-tight italic">
            "{current.question}"
          </span>
        </div>
        <div className="row gap-2 text-[11px] text-slate-400">
          <span>Connected Chain:</span>
          <span className={activeStage >= 1 ? 'text-cyan-400 font-bold' : 'text-slate-500'}>Design Limits</span>
          <span>→</span>
          <span className={activeStage >= 2 ? 'text-cyan-400 font-bold' : 'text-slate-500'}>As-Built Baseline</span>
          <span>→</span>
          <span className={activeStage >= 3 ? 'text-cyan-400 font-bold' : 'text-slate-500'}>Validation Envelope</span>
          <span>→</span>
          <span className={activeStage >= 4 ? 'text-cyan-400 font-bold' : 'text-slate-500'}>Live Health</span>
        </div>
      </div>
    </div>
  );
}
