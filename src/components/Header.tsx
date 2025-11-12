import React from 'react';
import {
  Users,
  MessageSquare,
  Tag,
  BarChart3,
  Files,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavLink } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { name: 'Chat', icon: MessageSquare, path: '/' },
  { name: 'Khách hàng', icon: Users, path: '/customers' },
  { name: 'Tag', icon: Tag, path: '/tags' },
  { name: 'Báo cáo', icon: BarChart3, path: '/reports' },
];

const Header = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex items-center self-stretch bg-white py-3 px-4 border-b">
      <div className="flex items-center w-auto mr-6 gap-3">
        <img
          src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/2zk5n7fp_expires_30_days.png"}
          className="w-9 h-9 object-fill"
          alt="Zalo.Care logo"
        />
        <span className="text-black text-lg font-bold">
          {"Zalo.Care"}
        </span>
      </div>
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center py-2 px-3 gap-2 transition-colors border-b-2',
                  isActive
                    ? 'border-orange-500'
                    : 'border-transparent hover:bg-gray-100 rounded-md'
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder.svg" alt="Avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;