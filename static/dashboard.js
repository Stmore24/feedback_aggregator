
const API_BASE = window.location.origin;

// Message display
function showMessage(text, type = 'success') {
    const messageEl = document.getElementById('message');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    messageEl.innerHTML = `
        <div class="${bgColor} text-white px-6 py-4 rounded-lg shadow-lg max-w-sm">
            <div class="flex items-center">
                <span class="text-sm font-medium">${text}</span>
                <button onclick="this.parentElement.parentElement.parentElement.classList.add('translate-x-full')" 
                        class="ml-4 text-white hover:text-gray-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;

    messageEl.classList.remove('translate-x-full');

    setTimeout(() => {
        messageEl.classList.add('translate-x-full');
    }, 3000);
}

// Load products
async function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">Loading products...</div>';

    try {
        const response = await fetch(`${API_BASE}/products/`);
        const products = await response.json();

        if (products.length === 0) {
            productsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No products found.</div>';
            return;
        }

        productsGrid.innerHTML = products.map(product => `
            <div class="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer" 
                 onclick="showProductDetails('${product.product_id}')">
                <div class="mb-4">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-2">${product.description}</p>
                    <div class="text-primary-600 font-semibold">ID: ${product.product_id}</div>
                </div>
                <div class="text-sm text-gray-500 mt-4">
                    Created: ${new Date(product.created_at).toLocaleDateString()}
                </div>
                <div class="mt-4 text-primary-600 text-sm font-medium">
                    Click to view details →
                </div>
            </div>
        `).join('');
    } catch (error) {
        productsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-red-500">Error loading products</div>';
        console.error('Error:', error);
    }
}

// Show product details
async function showProductDetails(productId) {
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modal.classList.remove('hidden');
    modalTitle.textContent = `Product ${productId}`;
    modalContent.innerHTML = '<div class="text-center py-8 text-gray-500">Loading product details...</div>';

    try {
        const response = await fetch(`${API_BASE}/products/${productId}`);
        const product = await response.json();

        modalContent.innerHTML = `
            <div class="space-y-6">
                <div class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Product Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                            <div class="text-gray-900">${product.product_id}</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <div class="text-gray-900">${product.name}</div>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <div class="text-gray-900">${product.description}</div>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Rating Overview</h3>
                    <div class="flex items-center justify-between">
                        <div class="text-center">
                            <div class="text-3xl font-bold ${getScoreColor(product.average_score)}">${product.average_score || 'N/A'}</div>
                            <div class="text-sm text-gray-600">Average Rating</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-gray-800">${product.feedback_count}</div>
                            <div class="text-sm text-gray-600">Total Reviews</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Customer Reviews</h3>
                    ${product.feedback_entries.length > 0 ? `
                        <div class="space-y-4 max-h-96 overflow-y-auto">
                            ${product.feedback_entries.map(feedback => `
                                <div class="bg-white border border-gray-200 rounded-lg p-4">
                                    <div class="flex justify-between items-start mb-2">
                                        <span class="score-badge ${getScoreClasses(feedback.score)}">${feedback.score}/5</span>
                                        <span class="text-sm text-gray-500">${new Date(feedback.created_at).toLocaleDateString()}</span>
                                    </div>
                                    ${feedback.comment ? `<div class="text-gray-700 mt-2">"${feedback.comment}"</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div class="text-center py-8 text-gray-500">No reviews yet</div>'}
                </div>
            </div>
        `;
    } catch (error) {
        modalContent.innerHTML = '<div class="text-center py-8 text-red-500">Error loading product details</div>';
        console.error('Error:', error);
    }
}

// Close modal
function closeModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

// Helper functions
function getScoreColor(score) {
    if (!score) return 'text-gray-400';
    if (score >= 4.0) return 'text-green-600';
    if (score >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
}

function getScoreClasses(score) {
    if (score >= 4.0) {
        return 'bg-green-100 text-green-800 border border-green-200';
    } else if (score >= 3.0) {
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    } else {
        return 'bg-red-100 text-red-800 border border-red-200';
    }
}

// Add CSS for score badges
const style = document.createElement('style');
style.textContent = `
    .score-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.875rem;
        text-align: center;
        min-width: 3rem;
    }
`;
document.head.appendChild(style);

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);
