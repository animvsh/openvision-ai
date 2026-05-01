interface BadgeProps {
  variant?: 'low' | 'medium' | 'high' | 'critical'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'medium', children, className = '' }: BadgeProps) {
  const colors = {
    low: 'bg-neon-lime/20 text-neon-lime border border-neon-lime/50 shadow-[0_0_8px_rgba(0,255,0,0.4)]',
    medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.4)]',
    high: 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    critical: 'bg-red-600/30 text-red-300 border border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[variant]} ${className}`}>
      {children}
    </span>
  )
}

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}

export function Button({ variant = 'primary', children, onClick, type = 'button', disabled = false, className = '' }: ButtonProps) {
  const styles = {
    primary: 'border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-dark-bg transition-all duration-300 shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]',
    secondary: 'border-2 border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-dark-bg transition-all duration-300 shadow-[0_0_10px_rgba(255,0,255,0.3)] hover:shadow-[0_0_20px_rgba(255,0,255,0.6)]',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded font-medium ${styles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-dark-card rounded-lg shadow border border-dark-surface ${className}`}>
      {children}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`px-3 py-2 border border-dark-surface bg-dark-bg text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan transition-all ${className}`}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`px-3 py-2 border border-dark-surface bg-dark-bg text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export const ui = {
  Badge,
  Button,
  Card,
  Input,
  Select,
}
