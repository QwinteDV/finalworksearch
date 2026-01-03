'use client';

import { useState, useEffect, useCallback } from 'react';
import { products } from '@/lib/products';
import { transcribeAudio, startRecording } from '@/lib/voice-search';
import { enhanceSearchQuery } from '@/lib/groq-search';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filterProducts = useCallback((query) => {
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery)
    );
    setFilteredProducts(filtered);
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    filterProducts(query);
  }, [filterProducts]);

  const handleVoiceSearch = useCallback(async () => {
    if (isListening) return;

    try {
      setIsListening(true);
      setIsLoading(true);

      const { mediaRecorder, audioBlob } = await startRecording();
      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, 3000);

      audioBlob.then(async (blob) => {
        try {
          const transcript = await transcribeAudio(blob);
          if (transcript) {
            setIsLoading(true);
            const enhancedQuery = await enhanceSearchQuery(transcript);
            handleSearch(enhancedQuery);
          }
        } catch (error) {
          console.error('Error processing voice search:', error);
        } finally {
          setIsListening(false);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error starting voice recording:', error);
      setIsListening(false);
      setIsLoading(false);
    }
  }, [isListening, handleSearch]);

  useEffect(() => {
    setFilteredProducts(products);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Product Zoek Machine
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Zoek naar producten door te typen of met je stem
        </p>
        
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            onVoiceSearch={handleVoiceSearch}
            isListening={isListening}
          />
        </div>

        {searchQuery && (
          <div className="text-gray-500">
            {filteredProducts.length} producten gevonden voor "{searchQuery}"
          </div>
        )}
      </header>

      <main>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Bezig met zoeken...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen producten gevonden</h3>
            <p className="text-gray-500">Probeer een andere zoekterm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}