'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteConfirmDialogProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteConfirmDialog({
  lead, open, onClose, onDeleted,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!lead) return
    setLoading(true)

    try {
      // Delete tracker entries first (FK constraint)
      await supabase
        .from('tracker')
        .delete()
        .eq('funnel_id', lead.funnelId)

      // Delete the lead
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id)

      if (error) throw error

      onDeleted()
      onClose()
    } catch {
      // Silent — could add toast later
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Lead?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus lead{' '}
            <strong className="text-[#1A1A18]">{lead?.funnelId}</strong>
            {lead?.namaPaket ? ` — ${lead.namaPaket}` : ''}?
            <br />
            Tindakan ini tidak dapat dibatalkan. Semua data tracker terkait juga akan dihapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
