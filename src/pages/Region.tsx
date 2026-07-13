import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Gift } from 'lucide-react'
import QuestCard from '../components/QuestCard'
import PhoneModal from '../components/PhoneModal'
import { getQuestsByRegion, REQUIRED_COUNT, regionInfo } from '../data/quests'
import { useSubmissions, useUploadSubmission } from '../hooks/useSubmissions'
import { useRewardClaim } from '../hooks/useRewardClaim'
import { RegionSlug } from '../types'

export default function Region() {
  const { slug } = useParams<{ slug: string }>()
  const regionSlug = (slug === 'region2' ? 'region2' : 'region1') as RegionSlug
  const quests = getQuestsByRegion(regionSlug)
  const info = regionInfo[regionSlug]

  const { data: submissions = [] } = useSubmissions(regionSlug)
  const uploadMutation = useUploadSubmission(regionSlug)
  const rewardMutation = useRewardClaim(regionSlug)

  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const photoByQuestId = new Map(submissions.map((s) => [s.quest_id, s.photo_url]))
  const completedCount = photoByQuestId.size
  const eligible = completedCount >= REQUIRED_COUNT
  const percent = Math.min(100, (completedCount / quests.length) * 100)

  const handleUpload = (questId: number, file: File) => {
    setUploadingId(questId)
    uploadMutation.mutate(
      { questId, file },
      {
        onSuccess: () => {
          setUploadingId(null)
          const nextCount = photoByQuestId.has(questId) ? completedCount : completedCount + 1
          if (nextCount >= REQUIRED_COUNT && !claimed) {
            setShowPhoneModal(true)
          }
        },
        onError: () => setUploadingId(null),
      }
    )
  }

  const handlePhoneSubmit = (phone: string) => {
    rewardMutation.mutate(phone, {
      onSuccess: () => {
        setClaimed(true)
        setShowPhoneModal(false)
      },
    })
  }

  return (
    <div className="mobile-container bg-background pb-10">
      <div className="relative h-56 w-full overflow-hidden">
        <img src={info.image} alt={info.label} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-black/10" />
        <Link
          to="/"
          aria-label="뒤로가기"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </Link>
        <div className="absolute bottom-4 left-5 right-5">
          <h1 className="text-foreground text-2xl font-extrabold">{info.label}</h1>
          <p className="text-foreground/70 text-xs mt-1">{info.desc}</p>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-foreground">진행률</span>
          <span className="text-sm font-bold text-foreground">
            {completedCount}/{quests.length}
          </span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>

        {claimed ? (
          <div className="w-full py-3 rounded-full bg-primary/15 text-primary text-sm font-bold text-center mb-4">
            상품권 신청이 완료되었습니다. 곧 연락드릴게요!
          </div>
        ) : (
          <button
            onClick={() => eligible && setShowPhoneModal(true)}
            disabled={!eligible}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm mb-4 transition-transform ${
              eligible
                ? 'bg-accent text-accent-foreground active:scale-95'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Gift size={16} />
            상품권 받기 (3개 이상 완료!)
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 px-5">
        {quests.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            completed={photoByQuestId.has(q.id)}
            photoUrl={photoByQuestId.get(q.id)}
            uploading={uploadingId === q.id}
            onUpload={(file) => handleUpload(q.id, file)}
          />
        ))}
      </div>

      {showPhoneModal && (
        <PhoneModal
          onClose={() => setShowPhoneModal(false)}
          onSubmit={handlePhoneSubmit}
          submitting={rewardMutation.isPending}
        />
      )}
    </div>
  )
}
