import { FunctionalComponent } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Save, Trash2, Loader2 } from "lucide-preact";
import { LockedSwitch } from "./LockedSwitch";
import type { DailyVerse, Member, Stream } from "../types";
import { showToast } from "../utils";

interface MemberDetailsProps {
  member: Member | null;
  onClose: () => void;
  onSave: (updatedMember: Member) => Promise<void>;
  onDelete?: (memberId: number) => void;
  isCreating?: boolean;
}

const EMPTY_MEMBER: Member = {
  id: -1,
  name: "",
  phone: "",
  stream: "MALE",
  dob: null,
  dom: null,
  address: null,
  min_prayer_time: 20,
  min_bible_reading_time: 20,
  is_locked: false,
  daily_verse: null,
};

export const MemberDetails: FunctionalComponent<MemberDetailsProps> = ({
  member,
  onClose,
  onSave,
  onDelete,
  isCreating = false,
}) => {
  const [editedMember, setEditedMember] = useState<Member>(EMPTY_MEMBER);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedMember(isCreating ? EMPTY_MEMBER : member || EMPTY_MEMBER);
  }, [member, isCreating]);

  const handleSave = async () => {
    if (!editedMember.name.trim() || !editedMember.phone.trim()) {
      await showToast("Name and phone are required fields");
      return;
    }

    if (!editedMember.stream.trim()) {
      await showToast("Stream is required field");
      return;
    }

    if (!editedMember.min_prayer_time && !editedMember.min_bible_reading_time) {
      await showToast(
        "minimum prayer and bible reading time need to be atleast 1 minute",
      );
      return;
    }

    if (!editedMember.phone.trim().startsWith("+91")) {
      editedMember.phone = `+91${editedMember.phone.trim()}`;
    }

    for (const key in editedMember) {
      if (
        (editedMember as { [key: string]: any }).hasOwnProperty(key) &&
        typeof (editedMember as { [key: string]: any })[key] === "string"
      ) {
        (editedMember as { [key: string]: any })[key] = (
          editedMember as { [key: string]: any }
        )[key].trim();
      }
    }

    let isSuccess = false;
    setIsSaving(true);
    try {
      await onSave(editedMember);
      isSuccess = true; // Mark as successful if the promise resolves
    } catch (err: any) {
      await showToast(err.message || "Failed to save member.");
      isSuccess = false; // Mark as failed
    } finally {
      // This will ALWAYS run before the component can unmount
      setIsSaving(false);
    }

    // Only close the modal if the API call was successful
    if (isSuccess) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (member && onDelete) {
      if (confirm(`Are you sure you want to delete ${member.name}?`)) {
        onDelete(member.id);
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-gray-100 bg-opacity-75">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isCreating ? "Create New Member" : "Member Details"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl p-1"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={editedMember.name}
                onChange={(e) =>
                  setEditedMember({
                    ...editedMember,
                    name: (e.target as HTMLInputElement).value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="Enter member name"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={editedMember.phone}
                onChange={(e) =>
                  setEditedMember({
                    ...editedMember,
                    phone: (e.target as HTMLInputElement).value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stream *
              </label>
              <select
                value={editedMember.stream || ""}
                onChange={(e) =>
                  setEditedMember({
                    ...editedMember,
                    stream: (e.target as HTMLSelectElement).value as Stream,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">Select Stream</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="FUTURE">Future</option>
                <option value="SUNDAY_CLASS_TEACHER">
                  SUNDAY_CLASS_TEACHER
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Verse Type
              </label>
              <select
                value={editedMember.daily_verse || ""}
                onChange={(e) =>
                  setEditedMember({
                    ...editedMember,
                    daily_verse: (e.target as HTMLSelectElement)
                      .value as DailyVerse,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">None</option>
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="LARGE">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={editedMember.dob || ""}
                onChange={(e) =>
                  setEditedMember({
                    ...editedMember,
                    dob: (e.target as HTMLInputElement).value || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Marriage
              </label>
              <input
                type="date"
                value={editedMember.dom || ""}
                onChange={(e) =>
                  setEditedMember({
                    ...editedMember,
                    dom: (e.target as HTMLInputElement).value || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Prayer Time (minutes) *
              </label>
              <input
                type="number"
                value={editedMember.min_prayer_time ?? ""}
                onChange={(e) =>
                  setEditedMember({
                    ...editedMember,
                    min_prayer_time: (e.target as HTMLInputElement).value
                      ? Number((e.target as HTMLInputElement).value)
                      : 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="Enter minutes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Bible Reading Time (minutes) *
              </label>
              <input
                type="number"
                value={editedMember.min_bible_reading_time ?? ""}
                onChange={(e) =>
                  setEditedMember({
                    ...editedMember,
                    min_bible_reading_time: (e.target as HTMLInputElement).value
                      ? Number((e.target as HTMLInputElement).value)
                      : 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="Enter minutes"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={editedMember.address || ""}
                onChange={(e) =>
                  setEditedMember({
                    ...editedMember,
                    address: (e.target as HTMLTextAreaElement).value || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                rows={3}
                placeholder="Enter address"
              />
            </div>

            <LockedSwitch
              locked={editedMember.is_locked}
              onChange={(locked) =>
                setEditedMember({ ...editedMember, is_locked: locked })
              }
            />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving} // Disable button while saving
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-base font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving
                ? "Saving..."
                : isCreating
                  ? "Create Member"
                  : "Save Changes"}
            </button>
            {!isCreating && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isSaving} // Also disable delete while saving
                className="flex-1 sm:flex-none bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center text-base font-medium disabled:bg-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isSaving} // Disable cancel while saving
              className="flex-1 sm:flex-none bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200 text-base font-medium disabled:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
