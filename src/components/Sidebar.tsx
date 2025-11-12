import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

const topNavItems = [
  {
    path: '/',
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/gscw16ey_expires_30_days.png",
    tooltip: "Trang chủ",
  },
  {
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/07w0lrq8_expires_30_days.png",
    tooltip: "Icon 2",
  },
  {
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/gp6enmol_expires_30_days.png",
    tooltip: "Icon 3",
  },
  {
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/2z2zk51q_expires_30_days.png",
    tooltip: "Icon 4",
  },
  {
    path: '/settings',
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/pj4kofh0_expires_30_days.png",
    tooltip: "Cài đặt",
  },
];

const bottomIcons = [
  "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/72mbty4v_expires_30_days.png",
  "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/4qxt04z1_expires_30_days.png",
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="flex flex-col items-center w-8">
      <img
        src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/kdt844vf_expires_30_days.png"}
        className="w-[15px] h-[1px] mb-3 object-fill"
        alt="divider"
      />
      <div className="flex flex-col items-center self-stretch flex-grow gap-3">
        {topNavItems.map((item, index) => {
          const isActive = item.path ? location.pathname === item.path : false;

          const iconContent = (
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-md",
              isActive && "bg-gray-100 border border-solid border-gray-200"
            )}>
              {isActive ? (
                <div className="flex items-center justify-center w-6 h-6 bg-orange-500 rounded-md">
                  <img 
                    src={item.icon} 
                    className="w-4 h-4 object-contain"
                    alt={item.tooltip}
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
              ) : (
                <img 
                  src={item.icon} 
                  className="w-5 h-5 object-contain"
                  alt={item.tooltip}
                />
              )}
            </div>
          );

          if (item.path) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link to={item.path}>
                    {iconContent}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-orange-100 text-orange-800 border-orange-200">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return (
            <div key={index} className="flex items-center justify-center w-8 h-8">
              <img src={item.icon} className="w-5 h-5 object-contain" alt={item.tooltip} />
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-center self-stretch gap-3 mt-4">
        {bottomIcons.map((src, index) => (
          <img key={index} src={src} className="w-8 h-8 object-fill" alt={`bottom icon ${index + 1}`} />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;