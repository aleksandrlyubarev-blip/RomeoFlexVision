import {
  Bird,
  Cat,
  Dog,
  Fish,
  HelpCircle,
  Rabbit,
  Shell,
  Squirrel,
  Turtle,
  type LucideIcon,
} from 'lucide-react';
import type { AgentStatus } from '../types';
import RomeoPhdIcon from './icons/RomeoPhdIcon';

interface AgentAvatarProps {
  color: string;
  icon: string;
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
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
  sm: { wrapper: 'w-10 h-10', iconPx: 18, ring: 'w-14 h-14', dot: 'w-2 h-2' },
  md: { wrapper: 'w-16 h-16', iconPx: 28, ring: 'w-20 h-20', dot: 'w-2.5 h-2.5' },
  lg: { wrapper: 'w-24 h-24', iconPx: 42, ring: 'w-32 h-32', dot: 'w-3 h-3' },
};

const ICON_COMPONENTS: Record<string, LucideIcon> = {
  bird: Bird,
  cat: Cat,
  dog: Dog,
  fish: Fish,
  rabbit: Rabbit,
  shell: Shell,
  squirrel: Squirrel,
  turtle: Turtle,
};

type CustomIcon = React.FC<{ size: number }>;

const CUSTOM_ICON_COMPONENTS: Record<string, CustomIcon> = {
  'romeo-phd': RomeoPhdIcon,
};

export default function AgentAvatar({ color, icon, status, size = 'md', animate = true }: AgentAvatarProps) {
  const sz = SIZE_MAP[size];
  const statusColor = STATUS_COLORS[status];
  const isActive = status === 'computing';
  const CustomSvgIcon = CUSTOM_ICON_COMPONENTS[icon];
  const AnimalIcon = ICON_COMPONENTS[icon] ?? HelpCircle;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer pulse ring for computing state */}
      {isActive && (
        <div
          className={`absolute ${sz.ring} rounded-full animate-ping opacity-20`}
          style={{ backgroundColor: statusColor }}
        />
      )}

      {/* Morphing blob shape */}
      <div
        className={`${sz.wrapper} flex items-center justify-center relative ${animate ? 'animate-morph' : ''} ${isActive ? 'animate-float' : ''}`}
        style={{
          background: `radial-gradient(ellipse at 30% 30%, ${color}33, ${color}11)`,
          border: `1px solid ${color}44`,
          boxShadow: `0 0 20px ${color}22, inset 0 0 20px ${color}11`,
        }}
      >
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
        {CustomSvgIcon ? (
          <div className="relative z-10" style={{ filter: 'drop-shadow(0 0 6px #44cc11)' }}>
            <CustomSvgIcon size={sz.iconPx} />
          </div>
        ) : (
          <AnimalIcon
            className="relative z-10"
            size={sz.iconPx}
            strokeWidth={1.75}
            aria-hidden="true"
            style={{ color, filter: 'drop-shadow(0 0 6px currentColor)' }}
          />
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
