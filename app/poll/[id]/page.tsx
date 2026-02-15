import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import PollView from "@/components/poll-view";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const { data: poll } = await supabase.from('polls').select('question').eq('id', id).single();
    return {
        title: poll ? `Vote: ${poll.question} | LivePoll` : 'Poll Not Found',
    };
}

export default async function PollPage({ params }: PageProps) {
    const { id } = await params;

    const { data: poll, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !poll) {
        notFound();
    }

    // Ensure options is an array of strings
    const options = Array.isArray(poll.options)
        ? (poll.options as string[])
        : [];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 transition-colors">
            <PollView
                id={poll.id}
                question={poll.question}
                options={options}
                require_login={poll.require_login}
            />
        </div>
    );
}
