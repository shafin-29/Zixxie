import Navbar from "@/modules/home/ui/components/navbar";
import { Footer } from "@/modules/home/ui/components/footer";

interface Props {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <main className="max-h-screen flex flex-col min-h-screen overflow-auto hide-scrollbar">
      <Navbar />
      <div className="absolute inset-0 -z-10 h-full w-full" style={{background: 'linear-gradient(90deg, #1CB5E0 0%, #000851 100%)'}}/>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <Footer />
    </main>
  );
};

export default Layout;
