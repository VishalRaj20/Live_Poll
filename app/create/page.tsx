"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
    question: z.string().min(5, { message: "Question must be at least 5 characters." }),
    options: z.array(z.object({ value: z.string().min(1, "Option cannot be empty") }))
        .min(2, { message: "You need at least 2 options." }),
    require_login: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePoll() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            question: "",
            options: [{ value: "" }, { value: "" }],
            require_login: false,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options",
    });

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            // Get session token if logged in
            const { data: { session } } = await supabase.auth.getSession();
            const headers: any = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch('/api/poll', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    question: values.question,
                    options: values.options.map(o => o.value),
                    require_login: values.require_login
                })
            });

            if (!response.ok) throw new Error('Failed to create poll');

            const data = await response.json();
            toast.success("Poll created successfully!");
            router.push(`/poll/${data.id}`);
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="container mx-auto max-w-xl py-12 px-4 relative z-10">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-8 transition-colors hover:-translate-x-1 duration-200">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
                </Link>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    <Card className="border-0 shadow-2xl shadow-indigo-500/10 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-white/20 ring-1 ring-white/20">
                        <CardHeader className="space-y-1 text-center pb-8 border-b border-indigo-50 dark:border-indigo-900/20">
                            <motion.div variants={item}>
                                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                                    Create a New Poll
                                </CardTitle>
                            </motion.div>
                            <motion.div variants={item}>
                                <CardDescription className="text-base">
                                    Enter your question and add options for people to vote on.
                                </CardDescription>
                            </motion.div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <motion.div variants={item}>
                                        <FormField
                                            control={form.control}
                                            name="question"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-200">Question</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. What is your favorite framework?"
                                                            className="h-12 text-lg bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </motion.div>

                                    <div className="space-y-4">
                                        <motion.div variants={item} className="flex justify-between items-center">
                                            <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-200">Options</FormLabel>
                                        </motion.div>
                                        <div className="space-y-3">
                                            {fields.map((field, index) => (
                                                <motion.div
                                                    key={field.id}
                                                    variants={item}
                                                    className="flex gap-2 items-start group"
                                                >
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.value`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1 space-y-0">
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={`Option ${index + 1}`}
                                                                        {...field}
                                                                        className="h-11 transition-all border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white/50"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage className="text-xs mt-1" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {fields.length > 2 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => remove(index)}
                                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors h-11 w-11"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                        <FormMessage>{form.formState.errors.options?.root?.message}</FormMessage>

                                        <motion.div variants={item}>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => append({ value: "" })}
                                                className="w-full border-dashed border-2 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 text-slate-500 hover:text-indigo-600 h-12 rounded-xl transition-all"
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Add Another Option
                                            </Button>
                                        </motion.div>
                                    </div>

                                    <motion.div variants={item}>
                                        <FormField
                                            control={form.control}
                                            name="require_login"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-4 shadow-sm bg-indigo-50/30 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/30">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1">
                                                        <FormLabel className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 font-medium">
                                                            Strict Mode <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                                        </FormLabel>
                                                        <FormDescription className="text-xs">
                                                            Require users to log in to vote. Helps prevent duplicate voting.
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </motion.div>

                                    <motion.div variants={item}>
                                        <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold h-12 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 rounded-xl transition-all hover:scale-[1.02]" disabled={isLoading}>
                                            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Poll...</> : "Create Poll"}
                                        </Button>
                                    </motion.div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
