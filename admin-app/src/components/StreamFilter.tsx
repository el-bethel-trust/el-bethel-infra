import { FunctionalComponent } from "preact";
import { Lock } from "lucide-preact";
import type { StreamFilter as StreamFilterType, Member } from "../types";

interface StreamFilterProps {
  activeFilter: StreamFilterType;
  onFilterChange: (filter: StreamFilterType) => void;
  members: Member[];
}

export const StreamFilter: FunctionalComponent<StreamFilterProps> = ({
  activeFilter,
  onFilterChange,
  members,
}) => {
  const getStreamCount = (stream: StreamFilterType) => {
    switch (stream) {
      case "ALL":
        return members.length;
      case "LOCKED":
        return members.filter((m) => m.is_locked).length;
      case "MALE":
      case "FEMALE":
      case "FUTURE":
      case "SUNDAY_CLASS_TEACHER":
        return members.filter((m) => m.stream === stream).length;
      default:
        return 0;
    }
  };

  const filters = [
    {
      key: "ALL" as StreamFilterType,
      label: "All",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      key: "MALE" as StreamFilterType,
      label: "MALE",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      key: "FEMALE" as StreamFilterType,
      label: "FEMALE",
      color: "bg-pink-100 text-pink-800 border-pink-200",
    },
    {
      key: "FUTURE" as StreamFilterType,
      label: "FUTURE",
      color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    {
      key: "SUNDAY_CLASS_TEACHER" as StreamFilterType,
      label: "SUNDAY_CLASS_TEACHER",
      color: "bg-green-100 text-green-800 border-green-200",
    },
    {
      key: "LOCKED" as StreamFilterType,
      label: "LOCKED",
      color: "bg-red-100 text-red-800 border-red-200",
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              activeFilter === key
                ? `${color} border`
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {key === "LOCKED" && <Lock className="w-3 h-3" />}
            {label} ({getStreamCount(key)})
          </button>
        ))}
      </div>
    </div>
  );
};
