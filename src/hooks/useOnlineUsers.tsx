import { useState, useEffect } from 'react';
import { rtdb, auth } from '@/lib/firebase';
import { ref, onValue, onDisconnect, set, increment, serverTimestamp } from 'firebase/database';

/**
 * Hook to track and return the number of online users
 * Uses Firebase Realtime Database for presence detection
 */
export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  useEffect(() => {
    // Reference to the online users count in the database
    const onlineCountRef = ref(rtdb, '.info/connected');
    const presenceRef = ref(rtdb, 'presence');
    const totalOnlineRef = ref(rtdb, 'stats/onlineUsers');
    
    // Generate a unique session ID
    const sessionId = auth.currentUser?.uid || `anonymous-${Math.random().toString(36).substring(2, 15)}`;
    
    // Listen for connection state changes
    const unsubscribe = onValue(onlineCountRef, (snapshot) => {
      // If we're connected to the database
      if (snapshot.val() === true) {
        // Create a reference for this user's session
        const myConnectionRef = ref(rtdb, `presence/${sessionId}`);
        
        // When this client disconnects, remove the user from the presence system
        onDisconnect(myConnectionRef).remove();
        
        // Add this user to the presence system with a timestamp
        set(myConnectionRef, {
          online: true,
          lastSeen: serverTimestamp(),
          // You can add additional user data here if needed
          // userId: auth.currentUser?.uid,
          // displayName: auth.currentUser?.displayName
        });
        
        // Update the total online users count
        // Increment when connecting
        set(totalOnlineRef, increment(1));
        
        // Decrement when disconnecting
        onDisconnect(totalOnlineRef).set(increment(-1));
      }
    });
    
    // Listen to the total online users count
    const countUnsubscribe = onValue(totalOnlineRef, (snapshot) => {
      // Ensure the value is at least 0 (in case of database inconsistencies)
      const count = Math.max(0, snapshot.val() || 0);
      setOnlineUsers(count);
    });
    
    // Cleanup function to run when component unmounts
    return () => {
      unsubscribe();
      countUnsubscribe();
      // We don't manually remove the user here since onDisconnect will handle that
    };
  }, []);
  
  return onlineUsers;
};
