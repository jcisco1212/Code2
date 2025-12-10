import React from 'react';

const Upload: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-6">Upload Video</h1>
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
      <p className="text-gray-600">Drag and drop your video here or click to browse</p>
      <button className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg">Select File</button>
    </div>
  </div>
);

export default Upload;
