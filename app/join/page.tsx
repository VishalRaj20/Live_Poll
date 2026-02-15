"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function JoinPage() {
    const router = useRouter();
    const [pollId, setPollId] = useState("");

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        const input = pollId.trim();
        if (!input) return;

        let idToJoin = input;

        // Determine if input is a URL or just an ID
        if (input.includes('/')) {
            try {
                // It has slashes, try to extract the last segment or the one after 'poll'
                const urlObj = new URL(input.match(/^https?:\/\//) ? input : `https://${input}`);
                const segments = urlObj.pathname.split('/').filter(Boolean);

                const pollIndex = segments.indexOf('poll');
                if (pollIndex !== -1 && segments[pollIndex + 1]) {
                    idToJoin = segments[pollIndex + 1];
                } else if (segments.length > 0) {
                    idToJoin = segments[segments.length - 1];
                }
            } catch (e) {
                // If URL parsing fails, just use the raw input (maybe it's path-like string)
                const segments = input.split('/').filter(Boolean);
                if (segments.length > 0) idToJoin = segments[segments.length - 1];
            }
        }

        // Clean up ID (remove trailing slashes, etc.)
        idToJoin = idToJoin.replace(/\/$/, '');

        if (idToJoin.length < 5) {
            toast.error("Invalid Poll ID or URL");
            return;
        }

        router.push(`/poll/${idToJoin}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[30%] right-[20%] w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[20%] left-[40%] w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <Link href="/" className="absolute top-8 left-8 z-20 inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="border-0 shadow-2xl shadow-indigo-500/10 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-white/20 ring-1 ring-white/20">
                    <CardHeader className="text-center pb-8 border-b border-indigo-50 dark:border-indigo-900/20">
                        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                            Join a Poll
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            Enter the Poll ID or paste the share link below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleJoin} className="space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder="e.g. 123-abc or https://..."
                                    className="pl-12 h-14 text-lg bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all rounded-xl"
                                    value={pollId}
                                    onChange={(e) => setPollId(e.target.value)}
                                />
                            </div>
                            <Button type="submit" size="lg" className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 rounded-xl transition-all hover:scale-[1.02]">
                                Join Poll <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
