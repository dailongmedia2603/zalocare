import React from 'react';
import { Link } from 'react-router-dom';

const topIcons = [
  "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/gscw16ey_expires_30_days.png",
  "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/07w0lrq8_expires_30_days.png",
  "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/gp6enmol_expires_30_days.png",
  "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/2z2zk51q_expires_30_days.png",
  "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/pj4kofh0_expires_30_days.png",
];

const settingsIconUrl = "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/72mbty4v_expires_30_days.png";
const helpIconUrl = "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/4qxt04z1_expires_30_days.png";

const Sidebar = () => {
  return (
    <aside className="flex flex-col items-center w-16 py-4 bg-white shadow-md">
      <img
        src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/kdt844vf_expires_30_days.png"}
        className="w-[15px] h-[1px] mb-3 object-fill"
        alt="divider"
      />
      <div className="flex flex-col items-center self-stretch flex-grow gap-3">
        {topIcons.map((src, index) => (
          <button key={index} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <img src={src} className="w-8 h-8 object-fill" alt={`icon ${index + 1}`} />
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center self-stretch gap-3 mt-4">
        <div className="relative group flex items-center">
          <Link to="/settings" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <img src={settingsIconUrl} className="w-8 h-8 object-fill" alt="Cài đặt" />
          </Link>
          <div className="absolute left-full ml-3 px-3 py-1.5 rounded-md shadow-lg bg-orange-100 text-orange-800 text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Cài đặt
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <img src={helpIconUrl} className="w-8 h-8 object-fill" alt="Trợ giúp" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;