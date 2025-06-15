import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Test Page</h1>
      <p className="text-xl mb-8">If you can see this, your React app is rendering properly.</p>
      <p className="text-gray-600">This is a test page to diagnose rendering issues.</p>
    </div>
  );
};

export default TestPage;
