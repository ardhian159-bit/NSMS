import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Dashboard</h1>
            <p>Logged in as: {user.email}</p>
            <p>Role: {profile?.role}</p>
            <p>Name: {profile?.pic_name}</p>
        </div>
    )
}