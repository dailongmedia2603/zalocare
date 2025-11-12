import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LineChart, Filter, Database, FileText, Settings, HelpCircle, UserCircle } from 'lucide-react';

const topNavItems = [
  {
    path: '/',
    Icon: LineChart,
    tooltip: "Trang chủ"
  },
  {
    Icon: Filter,
  },
  {
    Icon: Database,
  },
  {
    Icon: FileText,
  },
  {
    path: '/settings',
    Icon: Settings,
    tooltip: "Cài đặt"
  }
];

const bottomNavItems = [
  { Icon: HelpCircle },
  { Icon: UserCircle },
];

const Sidebar = () => {
  return (
    <aside className="flex flex-col items-center w-16">
      <img
        src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/kdt844vf_expires_30_days.png"}
        className="w-[15px] h-[1px] my-3 object-fill"
        alt="divider"
      />
      <div className="flex flex-col items-center self-stretch flex-grow gap-3">
        {topNavItems.map((item, index) => {
          const { Icon } = item;
          
          if (!item.path) {
            return (
              <div key={index} className="flex items-center justify-center w-full h-12">
                <Icon className="w-6 h-6 text-gray-600" />
              </div>
            );
          }

          const navLinkContent = ({ isActive }: { isActive: boolean }) => (
            <div className={cn(
              "flex items-center justify-center w-full h-12",
              isActive && "bg-white border-l-4 border-orange-500 rounded-l-lg"
            )}>
              <Icon className={cn("w-6 h-6", isActive ? "text-orange-500" : "text-gray-600")} />
            </div>
          );

          const navLink = (
            <NavLink to={item.path} className="w-full">
              {({ isActive }) => navLinkContent({ isActive })}
            </NavLink>
          );

          if (item.tooltip) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  {navLink}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-orange-100 text-orange-800 border-orange-200">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return navLink;
        })}
      </div>
      <div className="flex flex-col items-center self-stretch gap-3 mt-4">
        {bottomNavItems.map(({ Icon }, index) => (
           <div key={index} className="flex items-center justify-center w-full h-12">
             <Icon className="w-6 h-6 text-gray-600" />
           </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;