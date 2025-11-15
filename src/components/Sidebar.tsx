import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LineChart,
  Filter,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { name: 'Analytics', icon: LineChart, path: undefined },
  { name: 'Filter', icon: Filter, path: undefined },
  { name: 'Database', icon: Database, path: undefined },
];

const Sidebar = () => {
  const location = useLocation();

  const handleItemClick = (name: string) => {
    showSuccess(`Opened ${name}`);
  };

  return (
    <aside className="flex flex-col items-center w-14">
      <div className="flex flex-col items-center self-stretch gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          const button = (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'w-10 h-10 rounded-lg border',
                isActive
                  ? 'bg-gray-100 border-gray-300'
                  : 'bg-white border-gray-200 hover:bg-gray-100',
              )}
              onClick={!item.path ? () => handleItemClick(item.name) : undefined}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-orange-500' : 'text-gray-700')} />
            </Button>
          );

          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                {item.path ? <NavLink to={item.path}>{button}</NavLink> : button}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;