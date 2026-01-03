// Main application
class ProductSearchApp {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.isListening = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        this.initializeElements();
        this.loadProducts();
        this.attachEventListeners();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.voiceButton = document.getElementById('voiceButton');
        this.productsGrid = document.getElementById('productsGrid');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.noResults = document.getElementById('noResults');
        this.searchInfo = document.getElementById('searchInfo');
        this.resultCount = document.getElementById('resultCount');
        this.currentQuery = document.getElementById('currentQuery');
        this.listeningIndicator = document.getElementById('listeningIndicator');
    }

    loadProducts() {
        this.products = products; // From products.js
        this.filteredProducts = this.products;
        this.renderProducts();
    }

    attachEventListeners() {
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        this.voiceButton.addEventListener('click', () => {
            this.handleVoiceSearch();
        });
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredProducts = this.products;
            this.hideSearchInfo();
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredProducts = this.products.filter(product =>
                product.name.toLowerCase().includes(lowerQuery) ||
                product.description.toLowerCase().includes(lowerQuery) ||
                product.category.toLowerCase().includes(lowerQuery)
            );
            this.showSearchInfo(query);
        }
        
        this.renderProducts();
    }

    async handleVoiceSearch() {
        if (this.isListening) return;

        try {
            this.isListening = true;
            this.startListeningUI();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                try {
                    this.stopListeningUI();
                    stream.getTracks().forEach(track => track.stop());
                    
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    const transcript = await this.transcribeAudio(audioBlob);
                    
                    if (transcript) {
                        this.showLoading(true);
                        const enhancedQuery = await this.enhanceSearchQuery(transcript);
                        this.searchInput.value = enhancedQuery;
                        this.handleSearch(enhancedQuery);
                    }
                } catch (error) {
                    console.error('Error processing voice search:', error);
                    this.stopListeningUI();
                } finally {
                    this.isListening = false;
                    this.showLoading(false);
                }
            };

            this.mediaRecorder.start();
            setTimeout(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
            }, 3000);

        } catch (error) {
            console.error('Error starting voice recording:', error);
            this.isListening = false;
            this.stopListeningUI();
        }
    }

    async transcribeAudio(audioBlob) {
        try {
            console.log('Sending audio to server proxy...');
            
            // Create proper FormData for Next.js API route
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server transcription error:', response.status, errorText);
                
                // Try to parse as JSON if possible
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText };
                }
                
                throw new Error(`Server transcription failed: ${response.status} - ${errorData.error || errorText}`);
            }

            const result = await response.json();
            console.log('Transcription result:', result);
            
            return result.text || '';
        } catch (error) {
            console.error('Error transcribing audio:', error);
            alert('Voice transcription failed. Please try again.');
            return '';
        }
    }

    async enhanceSearchQuery(query) {
        try {
            const response = await fetch('/api/enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: query })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Enhancement server error:', response.status, errorData);
                return query;
            }

            const result = await response.json();
            console.log('Enhancement result:', result);
            
            return result.response || query;
        } catch (error) {
            console.error('Error enhancing search query:', error);
            return query;
        }
    }

    renderProducts() {
        this.productsGrid.innerHTML = '';
        this.noResults.classList.add('hidden');

        if (this.filteredProducts.length === 0) {
            this.noResults.classList.remove('hidden');
            return;
        }

        this.filteredProducts.forEach(product => {
            const productCard = this.createProductCard(product);
            this.productsGrid.appendChild(productCard);
        });
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden';
        
        card.innerHTML = `
            <div class="bg-gray-200 h-48 flex items-center justify-center">
                <div class="text-gray-400">
                    <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
            </div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-900">${product.name}</h3>
                    <span class="px-2 py-1 text-xs rounded-full ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${product.inStock ? 'Op voorraad' : 'Niet op voorraad'}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-2 line-clamp-2">${product.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        ${product.category}
                    </span>
                    <span class="text-xl font-bold text-gray-900">
                        €${product.price.toFixed(2)}
                    </span>
                </div>
            </div>
        `;
        
        return card;
    }

    startListeningUI() {
        this.voiceButton.classList.add('bg-red-500', 'text-white', 'border-red-500', 'animate-pulse');
        this.voiceButton.classList.remove('bg-gray-100', 'text-gray-700', 'border-gray-300');
        this.listeningIndicator.classList.remove('hidden');
    }

    stopListeningUI() {
        this.voiceButton.classList.remove('bg-red-500', 'text-white', 'border-red-500', 'animate-pulse');
        this.voiceButton.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-300');
        this.listeningIndicator.classList.add('hidden');
    }

    showLoading(show) {
        if (show) {
            this.loadingIndicator.classList.remove('hidden');
            this.productsGrid.classList.add('hidden');
        } else {
            this.loadingIndicator.classList.add('hidden');
            this.productsGrid.classList.remove('hidden');
        }
    }

    showSearchInfo(query) {
        this.resultCount.textContent = this.filteredProducts.length;
        this.currentQuery.textContent = query;
        this.searchInfo.classList.remove('hidden');
    }

    hideSearchInfo() {
        this.searchInfo.classList.add('hidden');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProductSearchApp();
});