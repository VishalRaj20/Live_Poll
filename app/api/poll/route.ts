import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const createPollSchema = z.object({
    question: z.string().min(1, "Question is required"),
    options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
    require_login: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Server-side validation
        const validation = createPollSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Validation failed",
                details: validation.error.format()
            }, { status: 400 });
        }

        const { question, options, require_login } = validation.data;

        // Get User ID if authenticated
        let creator_id = null;
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (user && !authError) {
                creator_id = user.id;
            }
        }

        const { data, error } = await supabase
            .from('polls')
            .insert([
                { question, options, require_login, creator_id }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error('Server error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
