import React from 'react';
import {
  Users,
  MessageSquare,
  Tag,
  BarChart3,
  Files,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Chat', icon: MessageSquare, path: '/' },
  { name: 'Khách hàng', icon: Users, path: '/customers' },
  { name: 'Tag', icon: Tag, path: '/tags' },
  { name: 'Báo cáo', icon: BarChart3, path: '/reports' },
];

const Header = () => {
  return (
    <header className="flex items-center self-stretch bg-white py-3 px-4 border-b">
      <div className="flex items-center w-auto mr-6 gap-3">
        <img
          src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/2zk5n7fp_expires_30_days.png"}
          className="w-9 h-9 object-fill"
          alt="Torse.ai logo"
        />
        <span className="text-black text-lg font-bold">
          {"Torse.ai"}
        </span>
      </div>
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end // Important for the root path to not match all other paths
              className={({ isActive }) =>
                cn(
                  'flex items-center py-2 px-3 gap-2 rounded-md hover:bg-gray-100 transition-colors'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'text-orange-500' : 'text-[#4E657F]'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm',
                      isActive ? 'text-black font-bold' : 'text-[#4E657F]'
                    )}
                  >
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="flex-1"></div>
      <div className="flex items-center gap-3">
        <button className="flex items-center justify-center w-9 h-9 rounded-md border hover:bg-gray-100">
            <Files className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-9 h-9 rounded-md bg-gray-200"></div>
      </div>
    </header>
  );
};

export default Header;