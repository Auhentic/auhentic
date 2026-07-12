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
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            !function(f,b,e,v,n,t,s)
                            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                            n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];
                            s.parentNode.insertBefore(t,s)}(window, document,'script',
                            'https://connect.facebook.net/en_US/fbevents.js');
                            fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                            fbq('track', 'PageView');
                        `,
                    }}
                />
            </head>
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