import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
    const adminModules = [
        {
            title: "Analytics & Heatmap",
            description: "View user stats, event tracking, and screen heatmaps.",
            icon: <BarChart className="w-8 h-8 text-primary" />,
            href: "/admin/analytics",
            action: "View Analytics"
        },
        {
            title: "Polls & Feedback",
            description: "Create, manage, and view results for user polls.",
            icon: <MessageSquare className="w-8 h-8 text-primary" />,
            href: "/admin/polls",
            action: "Manage Polls"
        }
    ];

    return (
        <div className="min-h-screen bg-background p-8">
            <Head>
                <title>Admin Dashboard | Visual Sound Design</title>
            </Head>

            <div className="max-w-5xl mx-auto space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your application settings, analytics, and content.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {adminModules.map((module, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="p-2 bg-secondary rounded-lg">
                                    {module.icon}
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">{module.title}</CardTitle>
                                    <CardDescription>{module.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Link href={module.href}>
                                    <Button className="w-full justify-between group">
                                        {module.action}
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
