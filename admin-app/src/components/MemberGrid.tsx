import { FunctionalComponent } from 'preact';
import { MemberCard } from './MemberCard';
import type { Member } from '../types';

interface MemberGridProps {
  members: Member[];
  onMemberSelect: (member: Member) => void;
  searchTerm: string;
  activeFilter: string;
}

export const MemberGrid: FunctionalComponent<MemberGridProps> = ({
  members,
  onMemberSelect,
  searchTerm,
  activeFilter,
}) => {
  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {searchTerm || activeFilter !== 'all'
          ? 'No members found matching your criteria.'
          : "No members found. Click 'Add Member' to create your first member."}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          onClick={() => onMemberSelect(member)}
        />
      ))}
    </div>
  );
};
