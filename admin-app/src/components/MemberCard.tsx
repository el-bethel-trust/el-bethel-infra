import { FunctionalComponent } from 'preact';
import { Phone, Lock, Unlock } from 'lucide-preact';
import type { Member } from '../types';

interface MemberCardProps {
  member: Member;
  onClick: () => void;
}

export const MemberCard: FunctionalComponent<MemberCardProps> = ({
  member,
  onClick,
}) => {
  const getStreamColor = (stream: string) => {
    switch (stream) {
      case 'MALE':
        return 'bg-blue-100 text-blue-800';
      case 'FEMALE':
        return 'bg-pink-100 text-pink-800';
      case 'FUTURE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-100"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{member.name}</h3>
          <div className="flex items-center mt-2 text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            <span className="text-sm">{member.phone}</span>
          </div>
          {member.stream && (
            <div className="mt-2">
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStreamColor(member.stream)}`}
              >
                {member.stream}
              </span>
            </div>
          )}
        </div>
        <div className="ml-4">
          {member.is_locked ? (
            <Lock className="w-5 h-5 text-red-500" />
          ) : (
            <Unlock className="w-5 h-5 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
};
