'use client';

import { useState } from 'react';

type AgentStatus = 'working' | 'idle';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: AgentStatus;
  task: string;
  deskX: number;
  deskY: number;
  idleX: number;
  idleY: number;
  idleActivity: string;
}

const initialAgents: Agent[] = [
  {
    id: 'kimi',
    name: 'Kimi',
    emoji: '🤖',
    color: '#a78bfa',
    status: 'working',
    task: 'Orchestrating agents',
    deskX: 140,
    deskY: 180,
    idleX: 60,
    idleY: 340,
    idleActivity: 'Sipping coffee ☕',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    emoji: '🧡',
    color: '#fb923c',
    status: 'working',
    task: 'Writing components',
    deskX: 380,
    deskY: 180,
    idleX: 500,
    idleY: 360,
    idleActivity: 'Reading docs 📚',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    emoji: '💚',
    color: '#4ade80',
    status: 'idle',
    task: 'Generating copy',
    deskX: 620,
    deskY: 180,
    idleX: 680,
    idleY: 350,
    idleActivity: 'Lounging on couch 🛋️',
  },
  {
    id: 'qa',
    name: 'QA Agent',
    emoji: '🔍',
    color: '#38bdf8',
    status: 'working',
    task: 'Running test suite',
    deskX: 260,
    deskY: 320,
    idleX: 180,
    idleY: 400,
    idleActivity: 'Playing ping pong 🏓',
  },
  {
    id: 'writer',
    name: 'Writer Agent',
    emoji: '✍️',
    color: '#f472b6',
    status: 'idle',
    task: 'Drafting blog post',
    deskX: 500,
    deskY: 320,
    idleX: 400,
    idleY: 410,
    idleActivity: 'Napping 💤',
  },
];

function Desk({ x, y, hasAgent }: { x: number; y: number; hasAgent: boolean }) {
  return (
    <g>
      {/* Desk surface */}
      <rect
        x={x - 50}
        y={y + 20}
        width={100}
        height={14}
        rx={3}
        fill={hasAgent ? '#2a2d35' : '#1e2028'}
        stroke="#3a3d47"
        strokeWidth={1}
      />
      {/* Desk legs */}
      <rect x={x - 44} y={y + 34} width={6} height={20} rx={1} fill="#22252d" />
      <rect x={x + 38} y={y + 34} width={6} height={20} rx={1} fill="#22252d" />
      {/* Monitor */}
      <rect
        x={x - 18}
        y={y - 2}
        width={36}
        height={24}
        rx={3}
        fill={hasAgent ? '#1a1c24' : '#15171d'}
        stroke={hasAgent ? '#4a4d57' : '#2a2d35'}
        strokeWidth={1}
      />
      {/* Screen glow when agent is working */}
      {hasAgent && (
        <rect
          x={x - 15}
          y={y + 1}
          width={30}
          height={18}
          rx={2}
          fill="#1e3a5f"
          opacity={0.6}
        />
      )}
      {/* Monitor stand */}
      <rect x={x - 3} y={y + 22} width={6} height={4} fill="#2a2d35" />
      {/* Chair */}
      <ellipse
        cx={x}
        cy={y + 60}
        rx={16}
        ry={8}
        fill={hasAgent ? '#1e2028' : '#191b22'}
        stroke="#2a2d35"
        strokeWidth={1}
      />
    </g>
  );
}

function AgentCharacter({
  agent,
  onClick,
}: {
  agent: Agent;
  onClick: () => void;
}) {
  const isWorking = agent.status === 'working';
  const x = isWorking ? agent.deskX : agent.idleX;
  const y = isWorking ? agent.deskY : agent.idleY;

  return (
    <g
      onClick={onClick}
      className="cursor-pointer"
      style={{ transition: 'transform 0.5s ease' }}
    >
      {/* Shadow */}
      <ellipse cx={x} cy={y + 18} rx={14} ry={5} fill="rgba(0,0,0,0.3)" />

      {/* Body */}
      <rect
        x={x - 12}
        y={y - 8}
        width={24}
        height={26}
        rx={8}
        fill={agent.color}
        opacity={0.9}
      />

      {/* Head */}
      <circle cx={x} cy={y - 16} r={12} fill={agent.color} />

      {/* Eyes */}
      <circle cx={x - 4} cy={y - 18} r={2} fill="#0e1014" />
      <circle cx={x + 4} cy={y - 18} r={2} fill="#0e1014" />
      {/* Eye shine */}
      <circle cx={x - 3.5} cy={y - 19} r={0.8} fill="rgba(255,255,255,0.7)" />
      <circle cx={x + 4.5} cy={y - 19} r={0.8} fill="rgba(255,255,255,0.7)" />

      {/* Mouth - smile when working, neutral when idle */}
      {isWorking ? (
        <path
          d={`M${x - 3},${y - 13} Q${x},${y - 10} ${x + 3},${y - 13}`}
          fill="none"
          stroke="#0e1014"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      ) : (
        <line
          x1={x - 2.5}
          y1={y - 12}
          x2={x + 2.5}
          y2={y - 12}
          stroke="#0e1014"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      )}

      {/* Emoji badge */}
      <text x={x} y={y - 30} textAnchor="middle" fontSize={14}>
        {agent.emoji}
      </text>

      {/* Name label */}
      <text
        x={x}
        y={y + 32}
        textAnchor="middle"
        fontSize={10}
        fill="hsl(225 20% 93%)"
        fontFamily="var(--font-mono), monospace"
        fontWeight={500}
      >
        {agent.name}
      </text>

      {/* Status indicator dot */}
      <circle
        cx={x + 10}
        cy={y - 24}
        r={4}
        fill={isWorking ? '#4ade80' : '#6b7280'}
        stroke="#0e1014"
        strokeWidth={1.5}
      />
      {isWorking && (
        <circle
          cx={x + 10}
          cy={y - 24}
          r={4}
          fill="#4ade80"
          opacity={0.5}
        >
          <animate
            attributeName="r"
            values="4;7;4"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Typing animation when working */}
      {isWorking && (
        <g>
          <circle cx={x - 6} cy={y + 6} r={1.5} fill="#0e1014" opacity={0.6}>
            <animate
              attributeName="cy"
              values={`${y + 6};${y + 4};${y + 6}`}
              dur="0.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={x} cy={y + 6} r={1.5} fill="#0e1014" opacity={0.6}>
            <animate
              attributeName="cy"
              values={`${y + 6};${y + 4};${y + 6}`}
              dur="0.4s"
              begin="0.13s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={x + 6} cy={y + 6} r={1.5} fill="#0e1014" opacity={0.6}>
            <animate
              attributeName="cy"
              values={`${y + 6};${y + 4};${y + 6}`}
              dur="0.4s"
              begin="0.26s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}

      {/* Activity text */}
      <text
        x={x}
        y={y + 44}
        textAnchor="middle"
        fontSize={8}
        fill={isWorking ? '#4ade80' : '#6b7280'}
        fontFamily="var(--font-mono), monospace"
      >
        {isWorking ? agent.task : agent.idleActivity}
      </text>
    </g>
  );
}

export default function OfficePage() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [nudgedAgent, setNudgedAgent] = useState<string | null>(null);

  const handleNudge = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, status: a.status === 'idle' ? 'working' : 'idle' }
          : a
      )
    );
    setNudgedAgent(agentId);
    setTimeout(() => setNudgedAgent(null), 1500);
  };

  const workingCount = agents.filter((a) => a.status === 'working').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold text-[hsl(var(--foreground))]">
            Agent Office
          </h1>
          <p className="text-xs text-[hsl(var(--foreground-dim))] mt-1">
            {workingCount}/{agents.length} agents working — click to nudge
          </p>
        </div>
        <div className="flex gap-4 text-xs text-[hsl(var(--foreground-dim))]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Working
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            Idle
          </span>
        </div>
      </div>

      {/* Office Scene */}
      <div
        className="rounded-lg border border-[hsl(var(--border))] overflow-hidden"
        style={{ background: '#0e1014' }}
      >
        <svg
          viewBox="0 0 780 480"
          className="w-full"
          style={{ maxHeight: 'calc(100vh - 160px)' }}
        >
          {/* Floor */}
          <rect x={0} y={280} width={780} height={200} fill="#12141a" />
          <line x1={0} y1={280} x2={780} y2={280} stroke="#1e2028" strokeWidth={2} />

          {/* Floor grid lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`floor-${i}`}
              x1={0}
              y1={300 + i * 25}
              x2={780}
              y2={300 + i * 25}
              stroke="#181a22"
              strokeWidth={0.5}
            />
          ))}

          {/* Wall decorations */}
          {/* Window */}
          <rect x={30} y={40} width={100} height={80} rx={4} fill="#141620" stroke="#2a2d35" strokeWidth={1.5} />
          <line x1={80} y1={40} x2={80} y2={120} stroke="#2a2d35" strokeWidth={1} />
          <line x1={30} y1={80} x2={130} y2={80} stroke="#2a2d35" strokeWidth={1} />
          {/* Stars through window */}
          <circle cx={50} cy={60} r={1} fill="#4a4d57" />
          <circle cx={70} cy={55} r={1.5} fill="#5a5d67" />
          <circle cx={100} cy={65} r={1} fill="#4a4d57" />
          <circle cx={110} cy={50} r={1} fill="#5a5d67" />

          {/* Whiteboard */}
          <rect x={320} y={30} width={140} height={90} rx={4} fill="#1a1c24" stroke="#3a3d47" strokeWidth={1.5} />
          <text x={390} y={55} textAnchor="middle" fontSize={9} fill="#4a4d57" fontFamily="var(--font-mono)">
            SPRINT BOARD
          </text>
          {/* Sticky notes on whiteboard */}
          <rect x={335} y={65} width={22} height={18} rx={2} fill="#a78bfa" opacity={0.3} />
          <rect x={362} y={62} width={22} height={18} rx={2} fill="#fb923c" opacity={0.3} />
          <rect x={389} y={67} width={22} height={18} rx={2} fill="#4ade80" opacity={0.3} />
          <rect x={416} y={63} width={22} height={18} rx={2} fill="#38bdf8" opacity={0.3} />
          <rect x={335} y={88} width={22} height={18} rx={2} fill="#f472b6" opacity={0.3} />

          {/* Clock */}
          <circle cx={700} cy={60} r={22} fill="#1a1c24" stroke="#3a3d47" strokeWidth={1.5} />
          <line x1={700} y1={60} x2={700} y2={46} stroke="#6b7280" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={700} y1={60} x2={710} y2={56} stroke="#6b7280" strokeWidth={1} strokeLinecap="round" />
          <circle cx={700} cy={60} r={2} fill="#6b7280" />

          {/* Coffee machine area */}
          <rect x={20} y={300} width={40} height={50} rx={4} fill="#1a1c24" stroke="#2a2d35" strokeWidth={1} />
          <text x={40} y={320} textAnchor="middle" fontSize={16}>☕</text>
          <text x={40} y={362} textAnchor="middle" fontSize={7} fill="#4a4d57" fontFamily="var(--font-mono)">
            COFFEE
          </text>

          {/* Couch */}
          <rect x={640} y={330} width={90} height={35} rx={10} fill="#1e2028" stroke="#2a2d35" strokeWidth={1} />
          <rect x={635} y={320} width={10} height={50} rx={5} fill="#1e2028" stroke="#2a2d35" strokeWidth={1} />
          <rect x={735} y={320} width={10} height={50} rx={5} fill="#1e2028" stroke="#2a2d35" strokeWidth={1} />

          {/* Plant */}
          <rect x={600} y={245} width={12} height={16} rx={2} fill="#2a2d35" />
          <circle cx={606} cy={240} r={10} fill="#166534" opacity={0.6} />
          <circle cx={600} cy={236} r={7} fill="#15803d" opacity={0.5} />
          <circle cx={612} cy={238} r={6} fill="#166534" opacity={0.5} />

          {/* Desks - render at each agent's desk position */}
          {agents.map((agent) => (
            <Desk
              key={`desk-${agent.id}`}
              x={agent.deskX}
              y={agent.deskY}
              hasAgent={agent.status === 'working'}
            />
          ))}

          {/* Agents */}
          {agents.map((agent) => (
            <AgentCharacter
              key={agent.id}
              agent={agent}
              onClick={() => handleNudge(agent.id)}
            />
          ))}

          {/* Nudge notification */}
          {nudgedAgent && (
            <g>
              {(() => {
                const agent = agents.find((a) => a.id === nudgedAgent);
                if (!agent) return null;
                const x = agent.status === 'working' ? agent.deskX : agent.idleX;
                const y = agent.status === 'working' ? agent.deskY : agent.idleY;
                return (
                  <>
                    <rect
                      x={x - 40}
                      y={y - 58}
                      width={80}
                      height={18}
                      rx={9}
                      fill="rgba(167, 139, 250, 0.2)"
                      stroke="#a78bfa"
                      strokeWidth={0.5}
                    />
                    <text
                      x={x}
                      y={y - 46}
                      textAnchor="middle"
                      fontSize={8}
                      fill="#a78bfa"
                      fontFamily="var(--font-mono), monospace"
                      fontWeight={600}
                    >
                      {agent.status === 'working' ? '👋 Back to work!' : '😴 Taking a break'}
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* "Mission Control HQ" sign */}
          <rect x={180} y={10} width={160} height={24} rx={4} fill="#1a1c24" stroke="#a78bfa" strokeWidth={1} opacity={0.6} />
          <text x={260} y={27} textAnchor="middle" fontSize={10} fill="#a78bfa" fontFamily="var(--font-mono)" fontWeight={600} opacity={0.8}>
            MISSION CONTROL HQ
          </text>
        </svg>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-5 gap-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => handleNudge(agent.id)}
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-left hover:border-[hsl(var(--border-bright))] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{agent.emoji}</span>
              <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                {agent.name}
              </span>
              <span
                className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${
                  agent.status === 'working'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-gray-500'
                }`}
              />
            </div>
            <p className="text-[10px] text-[hsl(var(--foreground-dim))] truncate">
              {agent.status === 'working' ? agent.task : agent.idleActivity}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
