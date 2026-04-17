'use client';

import { useState } from 'react';

type AgentStatus = 'working' | 'idle';

interface CharacterAppearance {
  gender: 'male' | 'female';
  skinTone: string;
  hairColor: string;
  shirtColor: string;
  bottomColor: string;
  kippahColor?: string;
}

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
  appearance: CharacterAppearance;
}

const initialAgents: Agent[] = [
  {
    id: 'henry',
    name: 'Henry',
    emoji: '🤖',
    color: '#a78bfa',
    status: 'working',
    task: 'Orchestrating agents',
    deskX: 140,
    deskY: 180,
    idleX: 60,
    idleY: 340,
    idleActivity: 'Pushing stroller 👶',
    appearance: {
      gender: 'male',
      skinTone: '#e8b88a',
      hairColor: '#2a1f14',
      shirtColor: '#2563eb',
      bottomColor: '#44403c',
      kippahColor: '#1a1a2e',
    },
  },
  {
    id: 'claudia',
    name: 'Claudia',
    emoji: '🧡',
    color: '#fb923c',
    status: 'working',
    task: 'Writing components',
    deskX: 380,
    deskY: 180,
    idleX: 500,
    idleY: 360,
    idleActivity: 'Folding laundry 🧺',
    appearance: {
      gender: 'female',
      skinTone: '#dba07a',
      hairColor: '#1a1110',
      shirtColor: '#c2410c',
      bottomColor: '#1e293b',
    },
  },
  {
    id: 'charlie',
    name: 'Charlie',
    emoji: '💚',
    color: '#4ade80',
    status: 'idle',
    task: 'Generating copy',
    deskX: 620,
    deskY: 180,
    idleX: 680,
    idleY: 350,
    idleActivity: 'Driving carpool 🚗',
    appearance: {
      gender: 'male',
      skinTone: '#f0c8a0',
      hairColor: '#5c3d2e',
      shirtColor: '#16a34a',
      bottomColor: '#1c1917',
      kippahColor: '#292524',
    },
  },
  {
    id: 'ralph',
    name: 'Ralph',
    emoji: '🔍',
    color: '#38bdf8',
    status: 'working',
    task: 'Running test suite',
    deskX: 260,
    deskY: 320,
    idleX: 180,
    idleY: 400,
    idleActivity: 'Cooking dinner 🍳',
    appearance: {
      gender: 'male',
      skinTone: '#f0c8a0',
      hairColor: '#8b7355',
      shirtColor: '#3b82f6',
      bottomColor: '#374151',
      kippahColor: '#6b7280',
    },
  },
  {
    id: 'quill',
    name: 'Quill',
    emoji: '✍️',
    color: '#f472b6',
    status: 'idle',
    task: 'Drafting blog post',
    deskX: 500,
    deskY: 320,
    idleX: 400,
    idleY: 410,
    idleActivity: 'Napping on couch 😴',
    appearance: {
      gender: 'female',
      skinTone: '#f5d0b0',
      hairColor: '#8b4513',
      shirtColor: '#64748b',
      bottomColor: '#7f1d1d',
    },
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
  const { gender, skinTone, hairColor, shirtColor, bottomColor, kippahColor } =
    agent.appearance;
  const isMale = gender === 'male';
  const handY = isWorking ? y + 0 : y + 4;
  const sideHairEnd = agent.id === 'claudia' ? -8 : -12;

  return (
    <g
      onClick={onClick}
      className="cursor-pointer"
      style={{ transition: 'transform 0.5s ease' }}
    >
      {/* Shadow */}
      <ellipse cx={x} cy={y + 22} rx={12} ry={4} fill="rgba(0,0,0,0.25)" />

      {/* === FEET === */}
      <rect x={x - 8} y={y + 18} width={6} height={3} rx={1.5} fill="#1a1a1a" />
      <rect x={x + 2} y={y + 18} width={6} height={3} rx={1.5} fill="#1a1a1a" />

      {/* === LOWER BODY === */}
      {isMale ? (
        <>
          {/* Pants - two legs */}
          <rect
            x={x - 8}
            y={y + 4}
            width={7}
            height={15}
            rx={2}
            fill={bottomColor}
          />
          <rect
            x={x + 1}
            y={y + 4}
            width={7}
            height={15}
            rx={2}
            fill={bottomColor}
          />
        </>
      ) : (
        /* Midi skirt - A-line */
        <path
          d={`M${x - 8} ${y + 3} L${x - 12} ${y + 18} Q${x} ${y + 20} ${x + 12} ${y + 18} L${x + 8} ${y + 3} Z`}
          fill={bottomColor}
        />
      )}

      {/* === TORSO === */}
      <rect
        x={x - 10}
        y={y - 12}
        width={20}
        height={17}
        rx={3}
        fill={shirtColor}
      />

      {/* Character-specific shirt details */}
      {agent.id === 'henry' && (
        /* Button-down shirt: center seam, buttons, collar */
        <>
          <line
            x1={x}
            y1={y - 9}
            x2={x}
            y2={y + 4}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={0.5}
          />
          <circle cx={x} cy={y - 6} r={0.6} fill="rgba(255,255,255,0.35)" />
          <circle cx={x} cy={y - 2} r={0.6} fill="rgba(255,255,255,0.35)" />
          <circle cx={x} cy={y + 2} r={0.6} fill="rgba(255,255,255,0.35)" />
          <path
            d={`M${x - 5} ${y - 12} L${x} ${y - 8} L${x + 5} ${y - 12}`}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
          />
        </>
      )}
      {agent.id === 'charlie' && (
        /* Collared shirt: collar points */
        <>
          <path
            d={`M${x - 5} ${y - 12} L${x - 2} ${y - 8}`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <path
            d={`M${x + 5} ${y - 12} L${x + 2} ${y - 8}`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </>
      )}
      {agent.id === 'claudia' && (
        /* Blouse: modest round neckline */
        <path
          d={`M${x - 4} ${y - 12} Q${x} ${y - 9} ${x + 4} ${y - 12}`}
          fill={skinTone}
        />
      )}
      {agent.id === 'quill' && (
        /* Cardigan: inner top visible through open front */
        <rect
          x={x - 4}
          y={y - 11}
          width={8}
          height={13}
          rx={1}
          fill="#ddd5cc"
        />
      )}
      {agent.id === 'ralph' && (
        /* Polo: small V-neck with collar hints */
        <>
          <path
            d={`M${x - 3} ${y - 12} L${x} ${y - 8} L${x + 3} ${y - 12}`}
            fill={skinTone}
          />
          <path
            d={`M${x - 5} ${y - 12} L${x - 4} ${y - 11}`}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <path
            d={`M${x + 5} ${y - 12} L${x + 4} ${y - 11}`}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </>
      )}

      {/* === ARMS (long sleeves) === */}
      {/* Left arm */}
      <path
        d={`M${x - 10} ${y - 9} Q${x - 15} ${y - 2} ${x - 14} ${handY}`}
        stroke={shirtColor}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={x - 14} cy={handY} r={2.5} fill={skinTone} />
      {/* Right arm */}
      <path
        d={`M${x + 10} ${y - 9} Q${x + 15} ${y - 2} ${x + 14} ${handY}`}
        stroke={shirtColor}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={x + 14} cy={handY} r={2.5} fill={skinTone} />

      {/* === NECK === */}
      <rect
        x={x - 2.5}
        y={y - 15}
        width={5}
        height={4}
        rx={1}
        fill={skinTone}
      />

      {/* === HEAD === */}
      <circle cx={x} cy={y - 22} r={9} fill={skinTone} />

      {/* === HAIR === */}
      {isMale ? (
        /* Short male hair - cap shape */
        <path
          d={`M${x - 9} ${y - 24} C${x - 9} ${y - 35} ${x + 9} ${y - 35} ${x + 9} ${y - 24}`}
          fill={hairColor}
        />
      ) : (
        /* Female hair - top volume with side strands */
        <>
          <path
            d={`M${x - 10} ${y - 24} C${x - 10} ${y - 36} ${x + 10} ${y - 36} ${x + 10} ${y - 24}`}
            fill={hairColor}
          />
          {/* Left side hair */}
          <path
            d={`M${x - 9.5} ${y - 26} Q${x - 12} ${y - 18} ${x - 11} ${y + sideHairEnd}`}
            stroke={hairColor}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
          {/* Right side hair */}
          <path
            d={`M${x + 9.5} ${y - 26} Q${x + 12} ${y - 18} ${x + 11} ${y + sideHairEnd}`}
            stroke={hairColor}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {/* === KIPPAH (males only) === */}
      {isMale && kippahColor && (
        <ellipse
          cx={x + 1}
          cy={y - 30}
          rx={5}
          ry={2.5}
          fill={kippahColor}
          transform={`rotate(-8 ${x + 1} ${y - 30})`}
        />
      )}

      {/* === FACE === */}
      {/* Eyes */}
      <circle cx={x - 3.5} cy={y - 23} r={1.3} fill="#1a1a1a" />
      <circle cx={x + 3.5} cy={y - 23} r={1.3} fill="#1a1a1a" />
      {/* Eye shine */}
      <circle
        cx={x - 3}
        cy={y - 23.5}
        r={0.5}
        fill="rgba(255,255,255,0.7)"
      />
      <circle
        cx={x + 4}
        cy={y - 23.5}
        r={0.5}
        fill="rgba(255,255,255,0.7)"
      />
      {/* Mouth */}
      {isWorking ? (
        <path
          d={`M${x - 2.5} ${y - 18} Q${x} ${y - 15.5} ${x + 2.5} ${y - 18}`}
          fill="none"
          stroke="#8b5e5e"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      ) : (
        <line
          x1={x - 2}
          y1={y - 17.5}
          x2={x + 2}
          y2={y - 17.5}
          stroke="#8b5e5e"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      )}

      {/* === STATUS INDICATORS === */}
      {/* Emoji badge */}
      <text x={x} y={y - 36} textAnchor="middle" fontSize={12}>
        {agent.emoji}
      </text>

      {/* Status dot */}
      <circle
        cx={x + 12}
        cy={y - 28}
        r={3.5}
        fill={isWorking ? '#4ade80' : '#6b7280'}
        stroke="#0e1014"
        strokeWidth={1.5}
      />
      {isWorking && (
        <circle
          cx={x + 12}
          cy={y - 28}
          r={3.5}
          fill="#4ade80"
          opacity={0.5}
        >
          <animate
            attributeName="r"
            values="3.5;6;3.5"
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
          <circle cx={x - 6} cy={y + 8} r={1.5} fill="#0e1014" opacity={0.6}>
            <animate
              attributeName="cy"
              values={`${y + 8};${y + 6};${y + 8}`}
              dur="0.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={x} cy={y + 8} r={1.5} fill="#0e1014" opacity={0.6}>
            <animate
              attributeName="cy"
              values={`${y + 8};${y + 6};${y + 8}`}
              dur="0.4s"
              begin="0.13s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={x + 6} cy={y + 8} r={1.5} fill="#0e1014" opacity={0.6}>
            <animate
              attributeName="cy"
              values={`${y + 8};${y + 6};${y + 8}`}
              dur="0.4s"
              begin="0.26s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}

      {/* Name label */}
      <text
        x={x}
        y={y + 34}
        textAnchor="middle"
        fontSize={10}
        fill="hsl(225 20% 93%)"
        fontFamily="var(--font-mono), monospace"
        fontWeight={500}
      >
        {agent.name}
      </text>

      {/* Activity text */}
      <text
        x={x}
        y={y + 46}
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
          <line
            x1={0}
            y1={280}
            x2={780}
            y2={280}
            stroke="#1e2028"
            strokeWidth={2}
          />

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
          <rect
            x={30}
            y={40}
            width={100}
            height={80}
            rx={4}
            fill="#141620"
            stroke="#2a2d35"
            strokeWidth={1.5}
          />
          <line
            x1={80}
            y1={40}
            x2={80}
            y2={120}
            stroke="#2a2d35"
            strokeWidth={1}
          />
          <line
            x1={30}
            y1={80}
            x2={130}
            y2={80}
            stroke="#2a2d35"
            strokeWidth={1}
          />
          {/* Stars through window */}
          <circle cx={50} cy={60} r={1} fill="#4a4d57" />
          <circle cx={70} cy={55} r={1.5} fill="#5a5d67" />
          <circle cx={100} cy={65} r={1} fill="#4a4d57" />
          <circle cx={110} cy={50} r={1} fill="#5a5d67" />

          {/* Whiteboard */}
          <rect
            x={320}
            y={30}
            width={140}
            height={90}
            rx={4}
            fill="#1a1c24"
            stroke="#3a3d47"
            strokeWidth={1.5}
          />
          <text
            x={390}
            y={55}
            textAnchor="middle"
            fontSize={9}
            fill="#4a4d57"
            fontFamily="var(--font-mono)"
          >
            SPRINT BOARD
          </text>
          {/* Sticky notes on whiteboard */}
          <rect
            x={335}
            y={65}
            width={22}
            height={18}
            rx={2}
            fill="#a78bfa"
            opacity={0.3}
          />
          <rect
            x={362}
            y={62}
            width={22}
            height={18}
            rx={2}
            fill="#fb923c"
            opacity={0.3}
          />
          <rect
            x={389}
            y={67}
            width={22}
            height={18}
            rx={2}
            fill="#4ade80"
            opacity={0.3}
          />
          <rect
            x={416}
            y={63}
            width={22}
            height={18}
            rx={2}
            fill="#38bdf8"
            opacity={0.3}
          />
          <rect
            x={335}
            y={88}
            width={22}
            height={18}
            rx={2}
            fill="#f472b6"
            opacity={0.3}
          />

          {/* Clock */}
          <circle
            cx={700}
            cy={60}
            r={22}
            fill="#1a1c24"
            stroke="#3a3d47"
            strokeWidth={1.5}
          />
          <line
            x1={700}
            y1={60}
            x2={700}
            y2={46}
            stroke="#6b7280"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <line
            x1={700}
            y1={60}
            x2={710}
            y2={56}
            stroke="#6b7280"
            strokeWidth={1}
            strokeLinecap="round"
          />
          <circle cx={700} cy={60} r={2} fill="#6b7280" />

          {/* Coffee machine area */}
          <rect
            x={20}
            y={300}
            width={40}
            height={50}
            rx={4}
            fill="#1a1c24"
            stroke="#2a2d35"
            strokeWidth={1}
          />
          <text x={40} y={320} textAnchor="middle" fontSize={16}>
            ☕
          </text>
          <text
            x={40}
            y={362}
            textAnchor="middle"
            fontSize={7}
            fill="#4a4d57"
            fontFamily="var(--font-mono)"
          >
            COFFEE
          </text>

          {/* Couch */}
          <rect
            x={640}
            y={330}
            width={90}
            height={35}
            rx={10}
            fill="#1e2028"
            stroke="#2a2d35"
            strokeWidth={1}
          />
          <rect
            x={635}
            y={320}
            width={10}
            height={50}
            rx={5}
            fill="#1e2028"
            stroke="#2a2d35"
            strokeWidth={1}
          />
          <rect
            x={735}
            y={320}
            width={10}
            height={50}
            rx={5}
            fill="#1e2028"
            stroke="#2a2d35"
            strokeWidth={1}
          />

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
                const nx =
                  agent.status === 'working' ? agent.deskX : agent.idleX;
                const ny =
                  agent.status === 'working' ? agent.deskY : agent.idleY;
                return (
                  <>
                    <rect
                      x={nx - 40}
                      y={ny - 58}
                      width={80}
                      height={18}
                      rx={9}
                      fill="rgba(167, 139, 250, 0.2)"
                      stroke="#a78bfa"
                      strokeWidth={0.5}
                    />
                    <text
                      x={nx}
                      y={ny - 46}
                      textAnchor="middle"
                      fontSize={8}
                      fill="#a78bfa"
                      fontFamily="var(--font-mono), monospace"
                      fontWeight={600}
                    >
                      {agent.status === 'working'
                        ? '👋 Back to work!'
                        : '😴 Taking a break'}
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* "Mission Control HQ" sign */}
          <rect
            x={180}
            y={10}
            width={160}
            height={24}
            rx={4}
            fill="#1a1c24"
            stroke="#a78bfa"
            strokeWidth={1}
            opacity={0.6}
          />
          <text
            x={260}
            y={27}
            textAnchor="middle"
            fontSize={10}
            fill="#a78bfa"
            fontFamily="var(--font-mono)"
            fontWeight={600}
            opacity={0.8}
          >
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
