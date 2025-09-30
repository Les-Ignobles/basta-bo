import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    const supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        supabaseResponse.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // Temporairement désactivé pour debug
    console.log('Middleware running for:', request.nextUrl.pathname)
    
    // const {
    //     data: { user },
    // } = await supabase.auth.getUser()

    // // Protect dashboard routes
    // if (request.nextUrl.pathname.startsWith('/dashboard')) {
    //     if (!user) {
    //         // Redirect to login page if not authenticated
    //         const url = request.nextUrl.clone()
    //         url.pathname = '/login'
    //         return NextResponse.redirect(url)
    //     }

    //     // Check if user has admin rights
    //     const { data: userProfile } = await supabase
    //         .from('user_profiles')
    //         .select('id, email, is_admin')
    //         .eq('uuid', user.id)
    //         .single()

    //     // If user doesn't have admin rights, redirect to unauthorized page
    //     if (!userProfile?.is_admin) {
    //         const url = request.nextUrl.clone()
    //         url.pathname = '/unauthorized'
    //         return NextResponse.redirect(url)
    //     }
    // }

    // // Redirect authenticated users away from login page
    // if (request.nextUrl.pathname === '/login' && user) {
    //     const url = request.nextUrl.clone()
    //     url.pathname = '/dashboard'
    //     return NextResponse.redirect(url)
    // }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely.

    return supabaseResponse
}
