import { useRef } from 'react'
import { Camera, Check, Loader2, RotateCcw } from 'lucide-react'
import { Quest } from '../types'

interface QuestCardProps {
  quest: Quest
  completed: boolean
  photoUrl?: string
  uploading: boolean
  onUpload: (file: File) => void
}

export default function QuestCard({
  quest,
  completed,
  photoUrl,
  uploading,
  onUpload,
}: QuestCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file) return

    onUpload(file)

    // 같은 파일도 다시 선택할 수 있도록 초기화
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
      <div className="relative shrink-0">
        {completed && photoUrl ? (
          <img
            src={photoUrl}
            alt={quest.title}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
              completed
                ? 'bg-primary/15 text-primary border-2 border-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {quest.order}
          </div>
        )}

        {completed && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
            <Check
              size={11}
              className="text-primary-foreground"
              strokeWidth={3}
            />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-bold leading-snug ${
            completed ? 'text-primary' : 'text-card-foreground'
          }`}
        >
          {quest.title}
        </p>

        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
          {quest.description}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*" // capture="environment" 제거하여 모바일 호환성 확보
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center justify-center w-9 h-9 rounded-full ${
            completed
              ? 'bg-primary/15 text-primary'
              : 'bg-muted text-muted-foreground'
          } active:scale-95 transition-transform disabled:opacity-50`}
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : completed ? (
            <RotateCcw size={15} />
          ) : (
            <Camera size={16} />
          )}
        </button>

        {completed && !uploading && (
          <span className="text-[9px] text-muted-foreground">
            다시찍기
          </span>
        )}
      </div>
    </div>
  )
}
