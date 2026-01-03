// Product data
const products = [
    {
        id: 1,
        name: "Apple iPhone 15 Pro",
        description: "De nieuwste iPhone met titanium behuizing en A17 Pro chip",
        price: 1199,
        category: "Smartphones",
        inStock: true,
    },
    {
        id: 2,
        name: "Samsung Galaxy S24 Ultra",
        description: "Premium Android telefoon met S Pen en geweldige camera",
        price: 1299,
        category: "Smartphones",
        inStock: true,
    },
    {
        id: 3,
        name: "MacBook Pro 14-inch",
        description: "Krachtige laptop met M3 Pro chip voor professioneel gebruik",
        price: 1999,
        category: "Laptops",
        inStock: true,
    },
    {
        id: 4,
        name: "Dell XPS 13",
        description: "Dunne en lichte Windows laptop met InfinityEdge display",
        price: 1299,
        category: "Laptops",
        inStock: false,
    },
    {
        id: 5,
        name: "Sony WH-1000XM5",
        description: "Premium noise cancelling hoofdtelefoon met uitstekende geluidskwaliteit",
        price: 399,
        category: "Audio",
        inStock: true,
    },
    {
        id: 6,
        name: "AirPods Pro 2",
        description: "Draadloze oordopjes met actieve noise cancelling",
        price: 249,
        category: "Audio",
        inStock: true,
    },
    {
        id: 7,
        name: "iPad Air",
        description: "Veelzijdige tablet met M1 chip voor werk en entertainment",
        price: 599,
        category: "Tablets",
        inStock: true,
    },
    {
        id: 8,
        name: "Microsoft Surface Pro 9",
        description: "2-in-1 tablet met laptop prestaties en Windows 11",
        price: 999,
        category: "Tablets",
        inStock: true,
    },
    {
        id: 9,
        name: "Nintendo Switch OLED",
        description: "Hybrid gameconsole met OLED scherm voor thuis en onderweg",
        price: 349,
        category: "Gaming",
        inStock: true,
    },
    {
        id: 10,
        name: "PlayStation 5",
        description: "Next-gen gameconsole met 4K gaming en snelle SSD",
        price: 499,
        category: "Gaming",
        inStock: false,
    },
    {
        id: 11,
        name: "Apple Watch Series 9",
        description: "Smartwatch met gezondheidsfuncties en fitness tracking",
        price: 429,
        category: "Wearables",
        inStock: true,
    },
    {
        id: 12,
        name: "Samsung Galaxy Watch 6",
        description: "Android smartwatch met uitgebreide gezondheidsmonitoring",
        price: 349,
        category: "Wearables",
        inStock: true,
    },
];

// Main Application Class
class ProductSearchApp {
    constructor() {
        this.products = products;
        this.filteredProducts = products;
        this.isListening = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        this.initializeElements();
        this.renderProducts();
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

            // Check browser support
            if (!window.MediaRecorder) {
                throw new Error('Je browser ondersteunt geen audio recording. Gebruik Chrome of Edge.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Find supported MIME type
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                }
            }
            
            this.mediaRecorder = new MediaRecorder(stream, { mimeType });
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
                    
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            console.log('Created audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
            
            const transcript = await this.transcribeAudio(audioBlob);
                    
                    if (transcript && transcript.trim()) {
                        this.searchInput.value = transcript;
                        this.handleSearch(transcript);
                    } else {
                        alert('Geen spraak gedetecteerd. Probeer het opnieuw.');
                    }
                } catch (error) {
                    console.error('Error processing voice search:', error);
                    alert('Voice search mislukt. Probeer het opnieuw.');
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
            alert(error.message || 'Microfoon toegang geweigerd. Sta microfoon toe en probeer opnieuw.');
        }
    }

    async transcribeAudio(audioBlob) {
        try {
            console.log('Audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
            
            // Send as FormData to ensure proper file handling
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Transcription failed');
            }

            const result = await response.json();
            return result.text || '';
        } catch (error) {
            console.error('Error transcribing audio:', error);
            throw error;
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