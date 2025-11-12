import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const topNavItems = [
  {
    path: '/',
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/gscw16ey_expires_30_days.png",
    tooltip: "Trang chủ"
  },
  {
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/07w0lrq8_expires_30_days.png",
  },
  {
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/gp6enmol_expires_30_days.png",
  },
  {
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/2z2zk51q_expires_30_days.png",
  },
  {
    path: '/settings',
    icon: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/pj4kofh0_expires_30_days.png",
    tooltip: "Cài đặt"
  }
];

const bottomIcons = [
  "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/72mbty4v_expires_30_days.png",
  "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/4qxt04z1_expires_30_days.png",
];

const Sidebar = () => {
  return (
    <aside className="flex flex-col items-center w-8">
      <img
        src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/kdt844vf_expires_30_days.png"}
        className="w-[15px] h-[1px] mb-3 object-fill"
        alt="divider"
      />
      <div className="flex flex-col items-center self-stretch flex-grow gap-3">
        {topNavItems.map((item, index) => {
          if (!item.path) {
            return <img key={index} src={item.icon} className="w-8 h-8 object-fill" alt={`icon ${index + 1}`} />;
          }

          const navLink = (
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg",
                  isActive && "bg-white border border-blue-200 shadow-sm"
                )
              }
            >
              <img src={item.icon} className="w-5 h-5 object-contain" alt={item.tooltip || `icon ${index + 1}`} />
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
        {bottomIcons.map((src, index) => (
          <img key={index} src={src} className="w-8 h-8 object-fill" alt={`bottom icon ${index + 1}`} />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;