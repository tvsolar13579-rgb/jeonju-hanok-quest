interface ProgressBarProps {
  completed: number
  total: number
  required: number
}

export default function ProgressBar({ completed, total, required }: ProgressBarProps) {
  const percent = Math.min(100, (completed / total) * 100)
  const reached = completed >= required

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-foreground">
          진행률 {completed} / {total}
        </span>
        <span className={`text-xs font-bold ${reached ? 'text-accent' : 'text-muted-foreground'}`}>
          {reached ? '상품권 지급 대상!' : `${required}개 달성 시 상품권 지급`}
        </span>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
