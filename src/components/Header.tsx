import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Users,
  MessageSquare,
  Lightbulb,
  BarChart3,
  CloudCog,
  Workflow,
  ClipboardList,
} from 'lucide-react';

const navItems = [
  { path: "/contacts", Icon: Users, label: "Contacts" },
  { path: "/conversations", Icon: MessageSquare, label: "Conversations" },
  { path: "/marketing", Icon: Lightbulb, label: "Marketing" },
  { path: "/sales", Icon: BarChart3, label: "Sales" },
  { path: "/services", Icon: CloudCog, label: "Services" },
  { path: "/automation", Icon: Workflow, label: "Automation" },
  { path: "/reporting", Icon: ClipboardList, label: "Reporting" },
];

const Header = () => {
  return (
    <header className="flex items-center self-stretch bg-white py-[13px] px-4">
      <NavLink to="/" className="flex items-center w-[105px] mr-[18px] gap-3.5">
        <img
          src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/2zk5n7fp_expires_30_days.png"}
          className="w-9 h-9 object-fill"
          alt="Torse.ai logo"
        />
        <span className="text-black text-base font-bold">
          {"Torse.ai"}
        </span>
      </NavLink>
      <nav className="flex items-start">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className="flex items-center py-2 px-3 gap-2"
          >
            {({ isActive }) => (
              <>
                <item.Icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-orange-500" : "text-[#4E657F]"
                  )}
                />
                <span className={cn("text-sm", isActive ? "text-black font-bold" : "text-[#4E657F]")}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="flex-1 self-stretch"></div>
      <div className="flex items-start gap-3">
        <img
          src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/zfh9ri4j_expires_30_days.png"}
          className="w-[30px] h-[30px] object-fill"
          alt="icon 1"
        />
        <img
          src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/483uqjj3_expires_30_days.png"}
          className="w-[30px] h-[30px] object-fill"
          alt="icon 3"
        />
      </div>
    </header>
  );
};

export default Header;