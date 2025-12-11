import Link from 'next/link';
import { Music, ArrowRight } from 'lucide-react';
import { myFont } from '@/font/font';

export default function AppHub() {
  return (
    <div className={`min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden ${myFont.className}`}>
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full z-10 flex flex-col gap-12">
        <header className="text-center space-y-4">
          <h1 className={`text-5xl md:text-6xl font-bold bg-gradient-to-br from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent tracking-tight ${myFont.className}`}>
            Bonca Tools
          </h1>
          <p className={`text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto font-light ${myFont.className}`}>
            Ferramentas para se divertir criando.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/visual-audio-design"
            className="group relative bg-neutral-900/50 border border-neutral-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 block backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                <Music size={24} className="text-neutral-400 group-hover:text-blue-400" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-blue-200 transition-colors">
                  Visual Sound Design
                </h3>
                <p className="text-neutral-500 text-sm mt-2 leading-relaxed group-hover:text-neutral-400">
                  Crie experiências sonoras imersivas com ferramentas visuais intuitivas.
                </p>
              </div>

              <div className="flex items-center text-sm font-medium text-neutral-600 group-hover:text-blue-400 transition-colors pt-2">
                Abrir App <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Placeholder for future apps */}
          {/* <div className="border border-dashed border-neutral-800 rounded-2xl p-6 flex items-center justify-center text-neutral-700 font-medium select-none">
            Em breve...
          </div> */}
        </div>
      </div>
    </div>
  );
}