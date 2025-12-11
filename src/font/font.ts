import localFont from 'next/font/local';

export const myFont = localFont({
    src: './Poster-Cut-Neue-Regular.otf', // Caminho relativo
    display: 'swap', // Opcional: para evitar layout shift
});