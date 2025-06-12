'use client';

import type React from 'react';

import { useState } from 'react';
import toast from 'react-hot-toast';

type PinEntryProps = {
  onPinSubmit: (pin: string) => Promise<void>;
};

export function PinEntry({ onPinSubmit }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error('Please enter a PIN');
      return;
    }

    setIsLoading(true);

    try {
      await onPinSubmit(pin);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Invalid PIN. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Daily Verses Editor
          </h1>
          <p className="text-gray-600">Please enter your PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              PIN
            </label>
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter your PIN"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !pin.trim()}
            className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              isLoading || !pin.trim()
                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 shadow-md hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
