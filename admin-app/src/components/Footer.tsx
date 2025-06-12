import { FunctionalComponent } from 'preact';

export const Footer: FunctionalComponent = () => {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center text-gray-600">
          <p className="text-sm">
            © 2025 El-Bethel Admin System. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            Developed By{' '}
            <a href="https://linkedin.com/in/lovelindhoni">
              Lovelin Dhoni J B{' '}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
