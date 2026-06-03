import React from 'react';
import { AnalyticsDashboard } from '@/components/Admin/AnalyticsDashboard';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <Head>
                <title>Analytics | Visual Sound Design</title>
            </Head>
            <div className="max-w-4xl mx-auto mb-6">
                <Link href="/admin">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>
            <AnalyticsDashboard />
        </div>
    );
}
