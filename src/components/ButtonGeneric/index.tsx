export default function GButton({ Func, Name, className }: any) {

    return (
        <button onClick={Func} className={`bg-white w-30 h-10 rounded-sm ${className || ''}`}>
            {Name}
        </button>
    );

};