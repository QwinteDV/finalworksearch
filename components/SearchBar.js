'use client';

import { useState } from 'react';

export default function SearchBar({ onSearch, onVoiceSearch, isListening }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Zoek naar producten..."
              className="w-full px-4 py-3 pr-12 text-gray-900 bg-white border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            type="button"
            onClick={onVoiceSearch}
            className={`px-4 py-3 border-t border-r border-b rounded-r-lg transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
        {isListening && (
          <div className="absolute -bottom-8 left-0 text-sm text-red-500">
            Luisteren naar je stem...
          </div>
        )}
      </div>
    </form>
  );
}