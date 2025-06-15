import React from 'react';
import { Users } from 'lucide-react';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { motion } from 'framer-motion';

const OnlineUserCounter: React.FC = () => {
  const onlineUsers = useOnlineUsers();
  
  return (
    <div className="flex items-center space-x-2 bg-blue-600 text-white text-xs py-1 px-3 rounded-full">
      <Users size={14} className="text-white" />
      <div className="flex items-center">
        <span>Online Users:</span>
        <motion.span
          key={onlineUsers}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ml-1 font-bold"
        >
          {onlineUsers}
        </motion.span>
      </div>
    </div>
  );
};

export default OnlineUserCounter;
