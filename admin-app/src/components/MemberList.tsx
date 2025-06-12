import { FunctionalComponent } from 'preact';
import { StreamFilter } from './StreamFilter';
import { SearchBar } from './SearchBar';
import { AddMemberButton } from './AddMemberButton';
import { MemberGrid } from './MemberGrid';
import type { Member, StreamFilter as StreamFilterType } from '../types';

interface MemberListProps {
  members: Member[];
  activeStreamFilter: StreamFilterType;
  searchTerm: string;
  onFilterChange: (filter: StreamFilterType) => void;
  onSearchChange: (term: string) => void;
  onMemberSelect: (member: Member) => void;
  onCreateMember: () => void;
}

export const MemberList: FunctionalComponent<MemberListProps> = ({
  members,
  activeStreamFilter,
  searchTerm,
  onFilterChange,
  onSearchChange,
  onMemberSelect,
  onCreateMember,
}) => {
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);

    let matchesStream = false;
    switch (activeStreamFilter) {
      case 'ALL':
        matchesStream = true;
        break;
      case 'LOCKED':
        matchesStream = member.is_locked;
        break;
      default:
        matchesStream = member.stream === activeStreamFilter;
    }

    return matchesSearch && matchesStream;
  });

  return (
    <div>
      <StreamFilter
        activeFilter={activeStreamFilter}
        onFilterChange={onFilterChange}
        members={members}
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
        <AddMemberButton onClick={onCreateMember} />
      </div>

      <MemberGrid
        members={filteredMembers}
        onMemberSelect={onMemberSelect}
        searchTerm={searchTerm}
        activeFilter={activeStreamFilter}
      />
    </div>
  );
};
