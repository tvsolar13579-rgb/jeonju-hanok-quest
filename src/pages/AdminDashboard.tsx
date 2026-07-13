import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOut, Phone, Image as ImageIcon, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getQuestsByRegion } from '../data/quests'
import { Submission, RewardClaim } from '../types'

type Tab = 'claims' | 'submissions'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [checking, setChecking] = useState(true)
  const [tab, setTab] = useState<Tab>('claims')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/admin/login')
      } else {
        setChecking(false)
      }
    })
  }, [navigate])

  const claimsQuery = useQuery({
    queryKey: ['admin-reward-claims'],
    enabled: !checking,
    queryFn: async (): Promise<RewardClaim[]> => {
      const { data, error } = await supabase
        .from('reward_claims')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as RewardClaim[]
    },
  })

  const submissionsQuery = useQuery({
    queryKey: ['admin-submissions'],
    enabled: !checking,
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Submission[]
    },
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const markIssued = async (id: string) => {
    await supabase.from('reward_claims').update({ status: 'issued' }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-reward-claims'] })
  }

  const questTitle = (regionSlug: 'region1' | 'region2', questId: number) => {
    const quest = getQuestsByRegion(regionSlug).find((q) => q.id === questId)
    return quest ? quest.title : `퀘스트 #${questId}`
  }

  if (checking) {
    return <div className="mobile-container bg-background flex items-center justify-center h-screen text-muted-foreground">확인 중...</div>
  }

  return (
    <div className="mobile-container bg-background pb-10">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">관리자 대시보드</h1>
        <button onClick={handleLogout} aria-label="로그아웃" className="text-muted-foreground">
          <LogOut size={18} />
        </button>
      </div>

      <div className="flex px-5 pt-4 gap-2">
        <button
          onClick={() => setTab('claims')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold ${
            tab === 'claims' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          상품권 신청 ({claimsQuery.data?.length ?? 0})
        </button>
        <button
          onClick={() => setTab('submissions')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold ${
            tab === 'submissions' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          사진 제출 내역 ({submissionsQuery.data?.length ?? 0})
        </button>
      </div>

      {tab === 'claims' && (
        <div className="flex flex-col gap-2.5 px-5 pt-4">
          {claimsQuery.isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
          {claimsQuery.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">아직 신청 내역이 없습니다.</p>
          )}
          {claimsQuery.data?.map((claim) => (
            <div key={claim.id} className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="text-primary shrink-0" />
                  <span className="text-sm font-bold text-card-foreground">{claim.phone_number}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {claim.region_slug === 'region1' ? '1구역' : '2구역'} · {new Date(claim.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
              {claim.status === 'issued' ? (
                <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-full">
                  <CheckCircle2 size={13} /> 발급완료
                </span>
              ) : (
                <button
                  onClick={() => markIssued(claim.id)}
                  className="shrink-0 flex items-center gap-1 text-xs font-bold text-accent-foreground bg-accent px-2.5 py-1.5 rounded-full active:scale-95 transition-transform"
                >
                  <Clock size={13} /> 발급 처리
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'submissions' && (
        <div className="flex flex-col gap-2.5 px-5 pt-4">
          {submissionsQuery.isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
          {submissionsQuery.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">아직 제출된 사진이 없습니다.</p>
          )}
          {submissionsQuery.data?.map((s) => (
            <div key={s.id} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
              {s.photo_url ? (
                <img src={s.photo_url} alt="제출 사진" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon size={16} className="text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-card-foreground truncate">
                  {questTitle(s.region_slug, s.quest_id)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.region_slug === 'region1' ? '1구역' : '2구역'} · {new Date(s.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
