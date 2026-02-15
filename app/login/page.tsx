"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next") || "/dashboard"; // Default to dashboard after login

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Account created! You can now sign in.");
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Signed in successfully!");
                router.push(next);
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md relative z-10"
        >
            <Card className="border-0 shadow-2xl shadow-indigo-500/10 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-white/20 ring-1 ring-white/20">
                <CardHeader className="space-y-1 text-center pb-8 border-b border-indigo-50 dark:border-indigo-900/20">
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                        {isSignUp ? "Create an account" : "Welcome back"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isSignUp ? "Enter your email below to create your account" : "Enter your email below to login to your account"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold h-11 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 rounded-xl transition-all hover:scale-[1.02]" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                            {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        </span>
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold transition-colors"
                        >
                            {isSignUp ? "Sign In" : "Sign Up"}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[10%] right-[30%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-[10%] left-[20%] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <Link href="/" className="absolute top-8 left-8 z-20 inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors hover:-translate-x-1 duration-200">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Link>

            <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-indigo-600 relative z-20" />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
