import { Geist } from 'next/font/google';
import './globals.css';
import Tracker from '@/components/Tracker';

const geist = Geist({ subsets: ['latin'] });

export const metadata = {
    title: 'Auhentic',
    description: 'Fresh food delivered to your door',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={geist.className}>
                {/* <div className="min-h-screen bg-[#3AB54A]"> */}
                <div className="min-h-screen bg-[wheat]">
                    {children}
                </div>
                <Tracker />
            </body>
        </html>
    );
}