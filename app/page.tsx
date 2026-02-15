"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { ArrowRight, BarChart2, CheckCircle2, Share2, Zap } from "lucide-react";
import { useState, useEffect } from "react";

import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, LogOut, User } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [demoVotes, setDemoVotes] = useState({ option1: 0, option2: 0, option3: 0 });

  useEffect(() => {
    setMounted(true);

    // Initial animation for progress bars
    setTimeout(() => {
      setDemoVotes({ option1: 45, option2: 30, option3: 25 });
    }, 500);

    // Check Auth Status
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const interval = setInterval(() => {
      setDemoVotes(prev => ({
        option1: Math.min(90, Math.max(10, prev.option1 + (Math.random() > 0.5 ? 2 : -1))),
        option2: Math.min(90, Math.max(10, prev.option2 + (Math.random() > 0.5 ? 2 : -1))),
        option3: Math.min(90, Math.max(10, prev.option3 + (Math.random() > 0.5 ? 2 : -1))),
      }));
    }, 2000);

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // user state updates via subscription
  };

  if (!mounted) return null; // Avoid hydration mismatch on initial render with random values

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">

      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          LivePoll
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {authLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          ) : user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="sm:hidden text-slate-500 hover:text-indigo-600">
                <Link href="/dashboard" title="Dashboard">
                  <BarChart2 className="w-5 h-5" />
                </Link>
              </Button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500 hover:text-red-600 rounded-full w-8 h-8">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-slate-600 hover:text-indigo-600">
                <Link href="/join">Join</Link>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 rounded-full px-4">
                <Link href="/login">Login</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-32 pb-20 md:py-24 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 min-h-[calc(100vh-80px)]">

        {/* Left Column: Hero Content */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex-1 max-w-2xl text-center lg:text-left space-y-8"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium border border-indigo-100 dark:border-indigo-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Live Real-time Polling
          </motion.div>

          <motion.h1 variants={item} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Instant Feedback, <br />
            <span className="text-indigo-600 dark:text-indigo-500">Real-time Results.</span>
          </motion.h1>

          <motion.p variants={item} className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Create polls in seconds, share the link, and watch as votes roll in live. No sign-up required.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900 transition-all hover:scale-105" asChild>
              <Link href="/create">
                Create Poll <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105" asChild>
              <Link href="/join">
                Join Poll
              </Link>
            </Button>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-3 gap-4 pt-8 text-slate-500 dark:text-slate-400 text-sm">
            <div className="flex flex-col items-center lg:items-start gap-1">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex flex-col items-center lg:items-start gap-1">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              <span>Live Analytics</span>
            </div>
            <div className="flex flex-col items-center lg:items-start gap-1">
              <Share2 className="w-5 h-5 text-green-500" />
              <span>Share Anywhere</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Animated Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: [0, -20, 0] // Floating effect
          }}
          transition={{
            delay: 0.5,
            duration: 0.8,
            y: {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="flex-1 w-full max-w-md relative"
        >
          {/* Decorative Elements */}
          {/* Decorative Elements */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-10 -right-10 w-24 h-24 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-2xl opacity-60"
          ></motion.div>
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
              delay: 2
            }}
            className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-200 dark:bg-indigo-900/20 rounded-full blur-2xl opacity-60"
          ></motion.div>

          <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 relative z-10">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="text-xs font-mono text-slate-400">live-results.view</div>
              </div>
              <CardTitle className="pt-4 text-lg">What's the best framework?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Next.js</span>
                  <span>{Math.round((demoVotes.option1 / (demoVotes.option1 + demoVotes.option2 + demoVotes.option3)) * 100)}%</span>
                </div>
                <Progress value={(demoVotes.option1 / (demoVotes.option1 + demoVotes.option2 + demoVotes.option3)) * 100} className="h-3 bg-slate-100 dark:bg-slate-800 [&>.bg-primary]:bg-emerald-500" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Remix</span>
                  <span>{Math.round((demoVotes.option2 / (demoVotes.option1 + demoVotes.option2 + demoVotes.option3)) * 100)}%</span>
                </div>
                <Progress value={(demoVotes.option2 / (demoVotes.option1 + demoVotes.option2 + demoVotes.option3)) * 100} className="h-3 bg-slate-100 dark:bg-slate-800 [&>.bg-primary]:bg-blue-500" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>SvelteKit</span>
                  <span>{Math.round((demoVotes.option3 / (demoVotes.option1 + demoVotes.option2 + demoVotes.option3)) * 100)}%</span>
                </div>
                <Progress value={(demoVotes.option3 / (demoVotes.option1 + demoVotes.option2 + demoVotes.option3)) * 100} className="h-3 bg-slate-100 dark:bg-slate-800 [&>.bg-primary]:bg-orange-500" />
              </div>

              <div className="pt-2 text-xs text-center text-slate-400 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Top choice is trending
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
