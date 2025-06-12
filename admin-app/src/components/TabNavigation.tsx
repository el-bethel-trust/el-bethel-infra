import { FunctionalComponent } from 'preact';
import { Users, Settings } from 'lucide-preact';

interface TabNavigationProps {
  activeTab: 'members' | 'subadmins';
  onTabChange: (tab: 'members' | 'subadmins') => void;
}

export const TabNavigation: FunctionalComponent<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex">
          <button
            onClick={() => onTabChange('members')}
            className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Members
          </button>
          <button
            onClick={() => onTabChange('subadmins')}
            className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'subadmins'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Sub-Admins
          </button>
        </div>
      </div>
    </div>
  );
};
