import { FunctionalComponent } from 'preact';
import { Plus } from 'lucide-preact';

interface AddMemberButtonProps {
  onClick: () => void;
}

export const AddMemberButton: FunctionalComponent<AddMemberButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center justify-center font-medium"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Member
    </button>
  );
};
