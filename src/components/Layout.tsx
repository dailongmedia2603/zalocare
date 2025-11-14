import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="bg-[#F6F8FA] h-screen flex flex-col">
      <Header />
      <main className="flex flex-1 items-stretch p-2 gap-2 overflow-hidden">
        <Sidebar />
        <div className="flex bg-white flex-1 rounded-lg border border-solid border-[#EDEDED]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;