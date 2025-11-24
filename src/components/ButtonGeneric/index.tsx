interface GButtonProps {
    Func: () => void;
    Name: string;
    className?: string;
}

export default function GButton({ Func, Name, className }: GButtonProps) {

    return (
        <button onClick={Func} className={`bg-white w-30 h-10 rounded-sm ${className || ''}`}>
            {Name}
        </button>
    );

};