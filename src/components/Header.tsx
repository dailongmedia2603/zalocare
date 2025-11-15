import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Tag,
  BarChart3,
  LogOut,
  Image,
  Wand2,
  Settings,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const Header = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching profile:", error);
        } else {
          setProfile(data);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    if (profile?.first_name) {
      return profile.first_name[0];
    }
    if (userEmail) {
      return userEmail[0];
    }
    return 'U';
  };

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

  const navItems = [
    { name: 'Chat', icon: MessageSquare, path: '/' },
    { name: 'Khách hàng', icon: Users, path: '/customers' },
    { name: 'Tag', icon: Tag, path: '/tags' },
    { name: 'Thư viện ảnh', icon: Image, path: '/media-library' },
    { name: 'Báo cáo', icon: BarChart3, path: '/reports' },
    { name: 'Cấu hình Prompt', icon: Wand2, path: '/prompt-config' },
    { name: 'Cài đặt', icon: Settings, path: '/settings' },
  ];

  return (
    <header className="flex items-center self-stretch bg-white py-3 px-4 border-b">
      <div className="flex items-center w-auto mr-6">
        <img
          src="/logo-full.png"
          className="h-9 w-auto object-contain"
          alt="Zalo.Care logo"
        />
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || undefined} alt={fullName || 'Avatar'} />
                <AvatarFallback>{getInitials().toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{fullName || userEmail}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {fullName ? userEmail : ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/account-management')}>
              <UserCog className="mr-2 h-4 w-4" />
              <span>Quản lý tài khoản</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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