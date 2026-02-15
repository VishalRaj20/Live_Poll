import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const voteSchema = z.object({
    poll_id: z.string().uuid(),
    option_index: z.number().min(0),
    device_id: z.string().min(1),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = voteSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data", details: validation.error.format() }, { status: 400 });
        }

        const { poll_id, option_index, device_id } = validation.data;

        // Get IP address
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        // 1. Check if Poll requires login
        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .select('require_login')
            .eq('id', poll_id)
            .single();

        if (pollError || !poll) {
            return NextResponse.json({ error: "Poll not found" }, { status: 404 });
        }

        let user_id = null;

        if (poll.require_login) {
            // Authenticate User: We need to check use Authorization header or check session from cookies 
            // Using Supabase Auth helpers would be cleaner (e.g. createServerClient from @supabase/ssr), 
            // but for this simple setup we rely on the client passing the session via Authorization header manually or checking cookies.
            // Actually, easiest way is to pass access_token if needed, or rely on cookies.

            // HOWEVER, 'supabase' imported here is admin client? No, it's Anon client.
            // We will trust the client to manage the session state for now or use cookies.
            // BUT, verification is needed.

            // In a real strict implementation, we would extract the JWT from headers:
            const authHeader = request.headers.get('Authorization');
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                const { data: { user }, error: authError } = await supabase.auth.getUser(token);
                if (!user || authError) {
                    return NextResponse.json({ error: "Authentication required for this poll." }, { status: 401 });
                }
                user_id = user.id;
            } else {
                return NextResponse.json({ error: "Login required to vote on this poll." }, { status: 401 });
            }
        }

        // Prepare vote data
        const voteData = {
            poll_id,
            option_index,
            device_id,
            ip_address: ip,
            user_id: user_id // will be null if not logged in
        };

        // Perform Upsert
        // If logged in, conflict on (poll_id, user_id). If anonymous, conflict on (poll_id, device_id).
        // Since we have separate unique constraints, we can try to rely on Supabase's smart conflict resolution 
        // OR explicit onConflict. However, simple upsert might be tricky with partial unique indexes.
        // But here we have two separate unique constraints.
        // Let's try a standard upsert. If it fails due to the "other" constraint (e.g. logged in user switching devices), we handle it.
        // Actually, for simplicity and robustness given we just added (poll_id, device_id) and already had (poll_id, user_id):

        const { data, error } = await supabase
            .from('votes')
            .upsert(voteData, {
                onConflict: user_id ? 'poll_id, user_id' : 'poll_id, device_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Vote error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, vote: data });

    } catch (err) {
        console.error('Server error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
