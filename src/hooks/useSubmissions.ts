import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDeviceId } from '../lib/device'
import { RegionSlug, Submission } from '../types'

const STORAGE_PREFIX = 'hanok_submissions'

function storageKey(regionSlug: RegionSlug, deviceId: string) {
  return `${STORAGE_PREFIX}_${deviceId}_${regionSlug}`
}

function readSubmissions(regionSlug: RegionSlug, deviceId: string): Submission[] {
  try {
    const raw = localStorage.getItem(storageKey(regionSlug, deviceId))
    if (!raw) return []
    return JSON.parse(raw) as Submission[]
  } catch {
    return []
  }
}

function writeSubmissions(
  regionSlug: RegionSlug,
  deviceId: string,
  submissions: Submission[]
) {
  localStorage.setItem(storageKey(regionSlug, deviceId), JSON.stringify(submissions))
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useSubmissions(regionSlug: RegionSlug) {
  const deviceId = getDeviceId()

  return useQuery({
    queryKey: ['submissions', regionSlug, deviceId],
    queryFn: async (): Promise<Submission[]> => readSubmissions(regionSlug, deviceId),
  })
}

export function useUploadSubmission(regionSlug: RegionSlug) {
  const queryClient = useQueryClient()
  const deviceId = getDeviceId()

  return useMutation({
    mutationFn: async ({ questId, file }: { questId: number; file: File }) => {
      const photoUrl = await fileToBase64(file)

      const existing = readSubmissions(regionSlug, deviceId)

      // 사진 다시 찍기: 같은 퀘스트 기록이 있으면 새 사진으로 교체합니다.
      const withoutCurrent = existing.filter((s) => s.quest_id !== questId)

      const next: Submission[] = [
        ...withoutCurrent,
        {
          id: crypto.randomUUID(),
          device_id: deviceId,
          quest_id: questId,
          region_slug: regionSlug,
          photo_url: photoUrl,
          created_at: new Date().toISOString(),
        },
      ]

      writeSubmissions(regionSlug, deviceId, next)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', regionSlug, deviceId] })
    },
  })
}
