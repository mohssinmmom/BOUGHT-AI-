import React, { useState, useEffect } from 'react';

interface PaidFeatureWrapperProps {
  children: React.ReactNode;
}

export const PaidFeatureWrapper: React.FC<PaidFeatureWrapperProps> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasIt = await window.aistudio.hasSelectedApiKey();
        setHasKey(hasIt);
      }
    } catch (e) {
      console.error("Error checking key", e);
    } finally {
      setChecking(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions to avoid race condition
      setHasKey(true); 
    }
  };

  if (checking) return <div className="text-gray-400 p-4">Checking permissions...</div>;

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center">
        <h2 className="text-xl font-bold text-white">Premium Feature Locked</h2>
        <p className="text-gray-300 max-w-md">
          This feature requires a paid API key from a Google Cloud Project.
        </p>
        <button
          onClick={handleSelectKey}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Select Billing Project
        </button>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noreferrer"
          className="text-sm text-blue-400 hover:underline"
        >
          Learn more about billing
        </a>
      </div>
    );
  }

  return <>{children}</>;
};