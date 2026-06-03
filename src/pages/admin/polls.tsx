import React from 'react';
import PollManager from '@/components/Admin/PollManager';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PollsPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <Head>
                <title>Polls Management | Visual Sound Design</title>
            </Head>

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="mb-6">
                    <Link href="/admin">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                    </Link>
                </div>

                <PollManager />
            </div>
        </div>
    );
}
