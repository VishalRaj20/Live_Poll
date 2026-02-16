"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, Loader2, BarChart2, List, PieChart as PieChartIcon, Lock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useRouter } from "next/navigation";

interface PollViewProps {
    id: string;
    question: string;
    options: string[];
    require_login?: boolean;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function PollView({ id, question, options, require_login = false }: PollViewProps) {
    const router = useRouter();
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [confirmedOption, setConfirmedOption] = useState<number | null>(null); // Track actual voted option
    const [hasVoted, setHasVoted] = useState(false);
    const [votes, setVotes] = useState<number[]>(new Array(options.length).fill(0));
    const [totalVotes, setTotalVotes] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deviceId, setDeviceId] = useState("");
    const [viewMode, setViewMode] = useState<'list' | 'bar' | 'pie'>('list');
    const [user, setUser] = useState<any>(null); // Auth user state
    const userRef = useRef(user);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        let storedDeviceId = localStorage.getItem("livepoll_device_id");
        if (!storedDeviceId) {
            storedDeviceId = crypto.randomUUID();
            localStorage.setItem("livepoll_device_id", storedDeviceId);
        }
        setDeviceId(storedDeviceId);

        // Check Auth
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            return user;
        };

        checkUser().then(async (currentUser) => {
            await fetchVotes();
            // Check vote status based on strict mode
            if (require_login && currentUser) {
                checkIfVotedUser(currentUser.id);
            } else {
                checkIfVotedDevice(storedDeviceId);
            }
        });

        const channel = supabase
            .channel(`poll-${id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'votes', filter: `poll_id=eq.${id}` },
                (payload) => {
                    const newVote = payload.new as any;
                    console.log("Realtime INSERT received:", newVote);

                    // Ignore our own vote to prevent double counting (since we update optimistically)
                    // Use storedDeviceId (local var) and userRef.current (mutable ref) to avoid stale closures
                    if (newVote.device_id === storedDeviceId || (userRef.current && newVote.user_id === userRef.current.id)) {
                        console.log("Ignoring own vote via Realtime");
                        return;
                    }

                    setVotes((prev) => {
                        const newVotes = [...prev];
                        if (newVote.option_index >= 0 && newVote.option_index < newVotes.length) {
                            newVotes[newVote.option_index] += 1;
                        }
                        return newVotes;
                    });
                    setTotalVotes((prev) => prev + 1);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'votes', filter: `poll_id=eq.${id}` },
                (payload) => {
                    console.log("Realtime UPDATE received:", payload);
                    fetchVotes();
                }
            )
            .subscribe((status) => {
                console.log("Realtime connection status:", status);
                if (status === 'SUBSCRIBED') {
                    // toast.success("Connected to live updates");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, options.length, require_login]);

    async function fetchVotes() {
        const { data, error } = await supabase
            .from('votes')
            .select('option_index')
            .eq('poll_id', id);

        if (error) {
            console.error("Error fetching votes:", error);
            return;
        }

        const counts = new Array(options.length).fill(0);
        data?.forEach((v: any) => {
            if (v.option_index >= 0 && v.option_index < options.length) {
                counts[v.option_index]++;
            }
        });
        setVotes(counts);
        setTotalVotes(data?.length || 0);
        setIsLoading(false);
    }

    async function checkIfVotedDevice(dId: string) {
        const { data } = await supabase
            .from('votes')
            .select('id, option_index')
            .eq('poll_id', id)
            .eq('device_id', dId)
            .single();
        if (data) {
            setHasVoted(true);
            setSelectedOption(data.option_index);
            setConfirmedOption(data.option_index);
        }
    }

    async function checkIfVotedUser(uId: string) {
        const { data } = await supabase
            .from('votes')
            .select('id, option_index')
            .eq('poll_id', id)
            .eq('user_id', uId)
            .single();
        if (data) {
            setHasVoted(true);
            setSelectedOption(data.option_index);
            setConfirmedOption(data.option_index);
        }
    }

    async function handleVote() {
        if (selectedOption === null) return;

        if (require_login && !user) {
            toast.error("You must be logged in to vote on this strict poll.");
            router.push(`/login?next=/poll/${id}`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Get session token if logged in
            const { data: { session } } = await supabase.auth.getSession();
            const headers: any = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ poll_id: id, option_index: selectedOption, device_id: deviceId })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setHasVoted(true);
                    toast.info("You have already voted.");
                } else if (response.status === 401) {
                    toast.error("Login required.");
                    router.push(`/login?next=/poll/${id}`);
                } else {
                    throw new Error(data.error || "Failed to vote");
                }
            } else {
                setHasVoted(true);
                setConfirmedOption(selectedOption); // Update confirmed option
                toast.success("Vote recorded!");

                // Optimistically update local state
                setVotes((prev) => {
                    const newVotes = [...prev];

                    // If we had a previous vote, remove it
                    if (confirmedOption !== null && confirmedOption >= 0 && confirmedOption < newVotes.length) {
                        newVotes[confirmedOption] = Math.max(0, newVotes[confirmedOption] - 1);
                    }

                    // Add new vote
                    if (selectedOption !== null && selectedOption >= 0 && selectedOption < newVotes.length) {
                        newVotes[selectedOption] += 1;
                    }
                    return newVotes;
                });

                // Only increment total votes if this is a new vote (not a change)
                if (confirmedOption === null) {
                    setTotalVotes((prev) => prev + 1);
                }
            }

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    const chartData = options.map((opt, i) => ({
        name: opt,
        votes: votes[i],
        fill: COLORS[i % COLORS.length]
    }));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 animate-pulse">Loading poll...</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto p-4 relative z-10">
            {/* Background Gradients for context within wrapper */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none -m-4">
                <div className="absolute top-[20%] right-[20%] w-64 h-64 bg-fuchsia-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-[20%] left-[20%] w-64 h-64 bg-cyan-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10"
            >
                <Card className="border-0 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 overflow-hidden ring-1 ring-white/20 dark:ring-white/10">
                    <CardHeader className="border-b border-indigo-50 dark:border-indigo-900/20 pb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl md:text-3xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                                    {question}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-3">
                                    {require_login ? (
                                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
                                            <Lock className="w-3 h-3" />
                                            Strict Mode
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            Public Poll
                                        </div>
                                    )}
                                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        <BarChart2 className="w-3.5 h-3.5" />
                                        {totalVotes} votes
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleShare}
                                className="shrink-0 rounded-full w-10 h-10 border-indigo-100 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20 transition-all duration-300"
                                title="Share Poll"
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-8 pb-8 px-6 md:px-8">
                        <AnimatePresence mode="wait">
                            {!hasVoted ? (
                                <motion.div
                                    key="vote-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-8"
                                >
                                    <RadioGroup
                                        value={selectedOption?.toString()}
                                        onValueChange={(v) => setSelectedOption(parseInt(v))}
                                        className="space-y-4"
                                    >
                                        {options.map((option, index) => (
                                            <div
                                                key={index}
                                                onClick={() => setSelectedOption(index)}
                                                className={`relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer group hover:scale-[1.01] active:scale-[0.99] duration-200 ${selectedOption === index
                                                    ? 'bg-indigo-50/80 border-indigo-500 dark:bg-indigo-900/30 dark:border-indigo-500 shadow-md transform'
                                                    : 'bg-white/50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className={`mr-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${selectedOption === index
                                                    ? 'border-indigo-600 bg-indigo-600'
                                                    : 'border-slate-300 pb-[2px] group-hover:border-indigo-400'
                                                    }`}>
                                                    {selectedOption === index && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="h-2.5 w-2.5 rounded-full bg-white"
                                                        />
                                                    )}
                                                </div>
                                                <RadioGroupItem value={index.toString()} id={`option-${index}`} className="sr-only" />
                                                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-lg font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-900 dark:group-hover:text-indigo-100 transition-colors break-words leading-relaxed">
                                                    {option}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>

                                    {require_login && !user ? (
                                        <Button asChild className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white shadow-lg rounded-xl">
                                            <a href={`/login?next=/poll/${id}`}>
                                                <Lock className="w-4 h-4 mr-2" /> Login to Vote
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleVote}
                                            disabled={selectedOption === null || isSubmitting}
                                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/50 transition-all rounded-xl disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Submitting...
                                                </div>
                                            ) : (
                                                "Submit Vote"
                                            )}
                                        </Button>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-8"
                                >
                                    {/* View Toggle */}
                                    <div className="flex justify-center">
                                        <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl inline-flex shadow-inner">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewMode('list')}
                                                className={`rounded-lg px-4 transition-all duration-300 ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                <List className="w-4 h-4 mr-2" /> List
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewMode('bar')}
                                                className={`rounded-lg px-4 transition-all duration-300 ${viewMode === 'bar' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                <BarChart2 className="w-4 h-4 mr-2" /> Bar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewMode('pie')}
                                                className={`rounded-lg px-4 transition-all duration-300 ${viewMode === 'pie' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                <PieChartIcon className="w-4 h-4 mr-2" /> Pie
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="min-h-[350px] bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                                        {viewMode === 'list' && (
                                            <div className="space-y-5">
                                                {options.map((option, index) => {
                                                    const count = votes[index] || 0;
                                                    const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                                                    const isWinner = Math.max(...votes) === count && totalVotes > 0;
                                                    const isSelected = selectedOption === index;

                                                    return (
                                                        <div key={index} className="space-y-2.5">
                                                            <div className="flex justify-between items-end">
                                                                <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200 text-lg">
                                                                    {option}
                                                                    {isSelected && <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">You Voted</span>}
                                                                </div>
                                                                <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                                    {Math.round(percentage)}% <span className="text-slate-400 font-normal ml-1">({count} votes)</span>
                                                                </div>
                                                            </div>
                                                            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${percentage}%` }}
                                                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                                                    className={`h-full relative ${isWinner ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : (isSelected ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-slate-400 dark:bg-slate-600')}`}
                                                                >
                                                                    {/* Shimmer effect */}
                                                                    <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-shimmer"></div>
                                                                </motion.div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {viewMode === 'bar' && (
                                            <div className="h-[350px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                        <Tooltip
                                                            cursor={{ fill: 'transparent' }}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        />
                                                        <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                                                            {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {viewMode === 'pie' && (
                                            <div className="h-[350px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={chartData.filter(d => d.votes > 0)}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={100}
                                                            paddingAngle={5}
                                                            dataKey="votes"
                                                        >
                                                            {chartData.filter(d => d.votes > 0).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
                                        <Button
                                            variant="outline"
                                            onClick={() => setHasVoted(false)}
                                            className="w-full sm:w-auto gap-2 rounded-xl h-11 border-indigo-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 transition-all"
                                        >
                                            Change My Vote
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={handleShare}
                                            className="w-full sm:w-auto gap-2 rounded-xl h-11 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                        >
                                            <Copy className="w-4 h-4" /> Copy Link
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
