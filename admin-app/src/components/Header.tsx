import { FunctionalComponent } from 'preact';

export const Header: FunctionalComponent = () => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          El Bethel Dashboard
        </h1>
      </div>
    </div>
  );
};
