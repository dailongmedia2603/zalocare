import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="bg-[#F6F8FA] min-h-screen flex flex-col">
      <div className="w-full flex flex-col flex-1">
        <Header />
        <main className="flex flex-1 items-stretch my-3 mx-2 gap-2">
          <Sidebar />
          <div className="flex items-start bg-white flex-1 rounded-lg border border-solid border-[#EDEDED]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;