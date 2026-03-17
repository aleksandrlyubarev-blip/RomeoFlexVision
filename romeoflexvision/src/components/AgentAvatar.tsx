import type { AgentStatus } from '../types';
import { avatarDataUri } from '../data/avatars';

interface AgentAvatarProps {
  color: string;
  icon: string;
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  agentId?: string;
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  ready: '#73daca',
  computing: '#7aa2f7',
  error: '#ef4444',
  idle: '#6b7280',
  dev: '#d97706',
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  ready: 'Готов',
  computing: 'Вычисление',
  error: 'Ошибка',
  idle: 'Ожидание',
  dev: 'В разработке',
};

const SIZE_MAP = {
  sm: { wrapper: 'w-10 h-10', icon: 'text-lg', ring: 'w-14 h-14', dot: 'w-2 h-2' },
  md: { wrapper: 'w-16 h-16', icon: 'text-2xl', ring: 'w-20 h-20', dot: 'w-2.5 h-2.5' },
  lg: { wrapper: 'w-24 h-24', icon: 'text-4xl', ring: 'w-32 h-32', dot: 'w-3 h-3' },
};

export default function AgentAvatar({ color, icon, status, size = 'md', animate = true, agentId }: AgentAvatarProps) {
  const sz = SIZE_MAP[size];
  const statusColor = STATUS_COLORS[status];
  const isActive = status === 'computing';
  const dataUri = agentId ? avatarDataUri(agentId) : null;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer pulse ring for computing state */}
      {isActive && (
        <div
          className={`absolute ${sz.ring} rounded-full animate-ping opacity-20`}
          style={{ backgroundColor: statusColor }}
        />
      )}

      {/* Avatar: SVG portrait if available, otherwise morphing blob */}
      <div
        className={`${sz.wrapper} flex items-center justify-center relative overflow-hidden ${!dataUri && animate ? 'animate-morph' : ''} ${!dataUri && isActive ? 'animate-float' : ''}`}
        style={dataUri ? {
          border: `1px solid ${color}44`,
          boxShadow: `0 0 20px ${color}22`,
          borderRadius: '18%',
        } : {
          background: `radial-gradient(ellipse at 30% 30%, ${color}33, ${color}11)`,
          border: `1px solid ${color}44`,
          boxShadow: `0 0 20px ${color}22, inset 0 0 20px ${color}11`,
        }}
      >
        {dataUri ? (
          <img
            src={dataUri}
            alt={agentId}
            className="w-full h-full object-cover"
            style={{ borderRadius: 'inherit' }}
          />
        ) : (
          <>
            {/* Rotating inner geometry */}
            <div
              className={`absolute inset-2 opacity-20 ${isActive ? 'animate-spin' : ''}`}
              style={{
                background: `conic-gradient(from 0deg, transparent, ${color}66, transparent)`,
                borderRadius: '50%',
                animationDuration: '4s',
              }}
            />
            {/* Icon */}
            <span className={`${sz.icon} relative z-10 select-none`} style={{ color, filter: 'drop-shadow(0 0 6px currentColor)' }}>
              {icon}
            </span>
          </>
        )}
      </div>

      {/* Status dot */}
      <div
        className={`absolute bottom-0 right-0 ${sz.dot} rounded-full border-2 border-bg-primary`}
        style={{ backgroundColor: statusColor }}
        title={STATUS_LABELS[status]}
      />
    </div>
  );
}

export { STATUS_LABELS, STATUS_COLORS };
