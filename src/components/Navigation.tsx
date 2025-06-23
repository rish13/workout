import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, LogOut } from 'lucide-react';

interface NavigationProps {
  user: any;
  signOut: any;
}

const Navigation: React.FC<NavigationProps> = ({ user, signOut }) => {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8" />
            <span className="text-xl font-bold">WorkoutTracker</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span>Welcome, {user?.signInDetails?.loginId || user?.username}</span>
            <button
              onClick={signOut}
              className="flex items-center space-x-1 bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;