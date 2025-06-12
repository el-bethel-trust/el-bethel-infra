import { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Lock, ArrowRight } from 'lucide-preact';

interface PinAuthProps {
  onAuthenticate: (success: boolean) => void;
  verifyAdminPin: (pin: string) => Promise<{ success: boolean }>;
}

export const PinAuth: FunctionalComponent<PinAuthProps> = ({
  onAuthenticate,
  verifyAdminPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verifyPin = async (pin: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { success } = await verifyAdminPin(pin);

      if (success) {
        onAuthenticate(true);
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('PIN verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    verifyPin(pin);
  };

  const handlePinChange = (e: any) => {
    const value = e.target.value;
    setPin(value);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            El Bethel
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your PIN to access the admin dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="pin" className="sr-only">
                PIN
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-lg text-center tracking-widest"
                placeholder="Enter PIN"
                value={pin}
                onChange={handlePinChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-4 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading || pin.length < 4
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center">
                  Access <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
