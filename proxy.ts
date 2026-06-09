import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Belum login → redirect ke login (kecuali sudah di /login)
    const pathname = request.nextUrl.pathname
    if (!user && !pathname.startsWith('/login') && pathname !== '/') {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Sudah login → jangan bisa akses /login lagi
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Password baru di-reset admin → paksa ganti dulu (kecuali sudah di halaman itu)
    if (user && user.user_metadata?.must_change_password && pathname !== '/change-password') {
        return NextResponse.redirect(new URL('/change-password', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|public|opengraph-image|twitter-image).*)'],
}
