import React from 'react';

interface GButtonProps {
    Func: () => void;
    Name: string;
    className?: string;
}

export default function GButton({ Func, Name, className }: GButtonProps) {
    return (
        <button onClick={Func} className={`bg-white dark:bg-neutral-800 dark:text-neutral-200 dark:border dark:border-neutral-700 w-30 h-10 rounded-sm hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors ${className || ''}`}>
            {Name}
        </button>
    );
};