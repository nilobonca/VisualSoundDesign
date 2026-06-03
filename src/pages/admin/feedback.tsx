
import React from 'react';
import PollManager from '@/components/Admin/PollManager';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminFeedbackPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <Head>
                <title>Admin - Feedback Manager</title>
            </Head>

            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                    <Link href="/">
                        <Button variant="ghost">
                            <Home className="mr-2 h-4 w-4" /> Back to App
                        </Button>
                    </Link>
                </div>

                <PollManager />
            </div>
        </div>
    );
}
