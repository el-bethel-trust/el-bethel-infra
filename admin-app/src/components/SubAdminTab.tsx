import { FunctionalComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Save, Loader2 } from 'lucide-preact';
import type { Member, SubAdmins } from '../types';
import { showToast } from '../utils';

interface SubAdminTabProps {
  members: Member[];
  subAdmins: SubAdmins;
  onSave: (subAdmins: SubAdmins) => Promise<void>;
}

export const SubAdminTab: FunctionalComponent<SubAdminTabProps> = ({
  members,
  subAdmins,
  onSave,
}) => {
  const [editedSubAdmins, setEditedSubAdmins] = useState<SubAdmins>({
    ...subAdmins,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedSubAdmins(subAdmins);
  }, [subAdmins]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedSubAdmins);
    } catch (err: any) {
      await showToast(err.message || 'Failed to update sub-admins.');
    } finally {
      setIsSaving(false);
      await showToast('Successfully updated sub-admins');
    }
  };

  const getMemberName = (memberId: number | null) => {
    if (!memberId) return 'Not assigned';
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : 'Unknown Member';
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Sub-Admin Management
      </h2>

      {(['MALE', 'FEMALE', 'FUTURE'] as const).map((stream) => (
        <div key={stream} className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
            {stream} Stream
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current:{' '}
                {getMemberName(editedSubAdmins[stream as keyof SubAdmins])}
              </label>
              <select
                value={editedSubAdmins[stream] || ''}
                onChange={(e) => {
                  const target = e.target as HTMLSelectElement;
                  setEditedSubAdmins({
                    ...editedSubAdmins,
                    [stream]: target.value ? Number(target.value) : null,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={isSaving} // Disable button while saving
        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center justify-center disabled:bg-green-300 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};
