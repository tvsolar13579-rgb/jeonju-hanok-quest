import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getDeviceId } from '../lib/device'
import { RegionSlug, Submission } from '../types'

export function useSubmissions(regionSlug: RegionSlug) {
  const deviceId = getDeviceId()

  return useQuery({
    queryKey: ['submissions', regionSlug, deviceId],
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('region_slug', regionSlug)
        .eq('device_id', deviceId)

      if (error) throw error
      return data as Submission[]
    },
  })
}

export function useUploadSubmission(regionSlug: RegionSlug) {
  const queryClient = useQueryClient()
  const deviceId = getDeviceId()

  return useMutation({
    mutationFn: async ({ questId, file }: { questId: number; file: File }) => {
      // 사진 다시 찍기: 같은 퀘스트에 이미 제출한 기록이 있으면 먼저 삭제하고 새로 등록합니다.
      await supabase
        .from('submissions')
        .delete()
        .eq('device_id', deviceId)
        .eq('quest_id', questId)

      const ext = file.name.split('.').pop()
      const path = `${deviceId}/${regionSlug}/quest-${questId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('quest-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('quest-photos')
        .getPublicUrl(path)

      const { error: insertError } = await supabase.from('submissions').insert({
        device_id: deviceId,
        quest_id: questId,
        region_slug: regionSlug,
        photo_url: publicUrlData.publicUrl,
      })

      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', regionSlug, deviceId] })
    },
  })
}
