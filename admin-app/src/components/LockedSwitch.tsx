import { FunctionalComponent } from 'preact';

interface LockedSwitchProps {
  locked: boolean;
  onChange: (locked: boolean) => void;
}

export const LockedSwitch: FunctionalComponent<LockedSwitchProps> = ({
  locked,
  onChange,
}) => {
  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Locked Status
      </label>
      <div className="flex items-center space-x-3">
        <span
          className={`text-sm ${!locked ? 'text-green-600 font-medium' : 'text-gray-500'}`}
        >
          Unlocked
        </span>
        <button
          type="button"
          onClick={() => onChange(!locked)}
          className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            locked ? 'bg-red-500' : 'bg-green-500'
          } ${
            // Larger switch on mobile
            'h-8 w-16 sm:h-6 sm:w-11'
          }`}
        >
          <span
            className={`inline-block transform rounded-full bg-white transition-transform ${
              locked ? 'translate-x-9 sm:translate-x-6' : 'translate-x-1'
            } ${
              // Larger toggle on mobile
              'h-6 w-6 sm:h-4 sm:w-4'
            }`}
          />
        </button>
        <span
          className={`text-sm ${locked ? 'text-red-600 font-medium' : 'text-gray-500'}`}
        >
          Locked
        </span>
      </div>
    </div>
  );
};
