import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CustomerLayout({ children }) {
    return (
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}