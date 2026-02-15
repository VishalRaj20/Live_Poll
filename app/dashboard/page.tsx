"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, BarChart2, Calendar, ArrowRight, User, LogOut } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [createdPolls, setCreatedPolls] = useState<any[]>([]);
    const [votedPolls, setVotedPolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login?next=/dashboard");
                return;
            }
            setUser(user);
            await fetchData(user.id);
        };
        checkUser();
    }, [router]);

    async function fetchData(userId: string) {
        // Fetch Created Polls
        const { data: created } = await supabase
            .from('polls')
            .select('*')
            .eq('creator_id', userId)
            .order('created_at', { ascending: false });

        setCreatedPolls(created || []);

        // Fetch Voted Polls
        // We need to join votes with polls. 
        // Queries in Supabase JS with Foreign Keys:
        // .select('*, polls(*)') on 'votes' table
        const { data: votes } = await supabase
            .from('votes')
            .select('poll_id, polls(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Extract unique polls from votes (user might vote multiple times if allowed, but strict mode prevents it. 
        // Still, let's dedup just in case or just list them)
        const votedMap = new Map();
        votes?.forEach((v: any) => {
            if (v.polls) {
                votedMap.set(v.poll_id, v.polls);
            }
        });
        setVotedPolls(Array.from(votedMap.values()));

        setLoading(false);
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[5%] right-[10%] w-[500px] h-[500px] bg-purple-200/40 dark:bg-purple-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[600px] h-[600px] bg-indigo-200/40 dark:bg-indigo-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            {/* Navbar / Header */}
            <header className="border-b border-indigo-50 dark:border-indigo-900/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-20">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        LivePoll
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden md:block">{user?.email}</span>
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-white dark:border-slate-800 shadow-sm ring-2 ring-indigo-50 dark:ring-indigo-900/20">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-medium shadow-inner text-xs sm:text-sm">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors px-2 sm:px-3">
                            <span className="hidden sm:inline">Logout</span>
                            <span className="sm:hidden"><LogOut className="w-4 h-4" /></span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Dashboard</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Manage your polls and view your voting history.</p>
                    </div>
                    <Link href="/create">
                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 text-white font-medium px-6 py-6 rounded-xl hover:scale-105 transition-all">
                            <Plus className="w-5 h-5 mr-2" /> Create New Poll
                        </Button>
                    </Link>
                </motion.div>

                <Tabs defaultValue="created" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-2 max-w-full sm:max-w-[400px] h-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
                        <TabsTrigger value="created" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all h-full font-medium text-xs sm:text-sm">
                            Created <span className="hidden sm:inline ml-1">Polls</span> ({createdPolls.length})
                        </TabsTrigger>
                        <TabsTrigger value="voted" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm transition-all h-full font-medium text-xs sm:text-sm">
                            Voted <span className="hidden sm:inline ml-1">Polls</span> ({votedPolls.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Created Polls Tab */}
                    <TabsContent value="created" className="space-y-4">
                        {createdPolls.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                                <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BarChart2 className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No polls created yet</h3>
                                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Start engaging your audience by creating your first real-time poll today.</p>
                                <Link href="/create">
                                    <Button variant="outline" className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-indigo-900 dark:hover:bg-indigo-900/20">Create Your First Poll</Button>
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {createdPolls.map((poll) => (
                                    <motion.div key={poll.id} variants={item}>
                                        <PollCard poll={poll} type="created" />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </TabsContent>

                    {/* Voted Polls Tab */}
                    <TabsContent value="voted" className="space-y-4">
                        {votedPolls.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                                <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No voting history</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">You haven't participated in any polls yet. Join a poll to see your history here.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {votedPolls.map((poll) => (
                                    <motion.div key={poll.id} variants={item}>
                                        <PollCard poll={poll} type="voted" />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

function PollCard({ poll, type }: { poll: any, type: 'created' | 'voted' }) {
    return (
        <Link href={`/poll/${poll.id}`} className="block h-full">
            <Card className="h-full border-0 shadow-lg shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm group border-t-4 border-t-transparent hover:border-t-indigo-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-full pointer-events-none"></div>

                <CardHeader className="pb-3 relative z-10">
                    <div className="flex justify-between items-start gap-4">
                        <CardTitle className="line-clamp-2 text-lg font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                            {poll.question}
                        </CardTitle>
                        {poll.require_login && (
                            <div className="shrink-0" title="Strict Mode: Login Required">
                                <span className="flex h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-900/30"></span>
                            </div>
                        )}
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs font-medium pt-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500/70" />
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pb-16">
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs font-medium px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-md text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30">
                            {Array.isArray(poll.options) ? poll.options.length : 0} Options
                        </span>
                        {type === 'voted' && (
                            <span className="text-xs font-medium px-2.5 py-1 bg-green-50 dark:bg-green-900/20 rounded-md text-green-600 dark:text-green-300 border border-green-100 dark:border-green-800/30">
                                Voted
                            </span>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="absolute bottom-0 left-0 right-0 pt-4 pb-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/50 backdrop-blur-sm group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10 transition-colors">
                    <div className="w-full flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {type === 'created' ? 'Manage Poll' : 'View Results'}
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )
}
