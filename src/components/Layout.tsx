import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';

const Layout = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const location = useLocation();
  const isChatPage = location.pathname === '/';

  return (
    <div className="bg-[#F6F8FA] h-screen flex flex-col">
      <Header />
      <main className="flex flex-1 items-stretch p-2 gap-2 overflow-hidden">
        {isChatPage && (
          <Sidebar 
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        )}
        <div className="flex bg-white flex-1 rounded-lg border border-solid border-[#EDEDED]">
          <Outlet context={{ selectedFolderId, setSelectedFolderId }} />
        </div>
      </main>
    </div>
  );
};

export default Layout;