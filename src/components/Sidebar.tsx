import React, { useState } from 'react';
import {
  LineChart,
  Filter,
  Database,
  FileText,
  Settings2,
  HelpCircle,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

const topNavItems = [
  { name: 'Analytics', icon: LineChart, color: 'text-gray-700' },
  { name: 'Filter', icon: Filter, color: 'text-orange-500' },
  { name: 'Database', icon: Database, color: 'text-gray-700' },
  { name: 'Documents', icon: FileText, color: 'text-gray-700' },
  { name: 'Settings', icon: Settings2, color: 'text-gray-700' },
];

const bottomNavItems = [
  { name: 'Help', icon: HelpCircle },
  { name: 'Profile', icon: User },
];

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('Analytics'); // Default to first item

  const handleItemClick = (name: string) => {
    setActiveItem(name);
    showSuccess(`Opened ${name}`);
  };

  return (
    <aside className="flex flex-col items-center bg-white p-3 rounded-lg border border-solid border-[#EDEDED] w-20">
      <div className="flex flex-col items-center self-stretch flex-grow gap-3">
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.name;
          return (
            <Button
              key={item.name}
              variant="ghost"
              size="icon"
              className={cn(
                'w-14 h-14 rounded-lg border',
                isActive
                  ? 'bg-gray-100 border-gray-300'
                  : 'bg-white border-gray-200 hover:bg-gray-100',
              )}
              onClick={() => handleItemClick(item.name)}
            >
              <Icon className={cn('w-7 h-7', item.color)} />
            </Button>
          );
        })}
      </div>
      <div className="flex flex-col items-center self-stretch gap-3 mt-3 pt-3 border-t border-gray-200">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.name;
          return (
            <Button
              key={item.name}
              variant="ghost"
              size="icon"
              className={cn(
                'w-14 h-14 rounded-lg border',
                 isActive
                  ? 'bg-gray-100 border-gray-300'
                  : 'bg-white border-gray-200 hover:bg-gray-100',
              )}
              onClick={() => handleItemClick(item.name)}
            >
              <Icon className="w-7 h-7 text-gray-700" />
            </Button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;