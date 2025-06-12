import { FunctionalComponent } from 'preact';
import { Search } from 'lucide-preact';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const SearchBar: FunctionalComponent<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Search members by name or phone..."
        value={searchTerm}
        onChange={(e) => onSearchChange((e.target as HTMLInputElement).value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};
