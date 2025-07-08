
const API_BASE = '';

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('text-white', 'bg-primary-600', 'shadow-lg', 'transform', 'scale-105');
        button.classList.add('text-white/80', 'hover:text-white', 'hover:bg-white/20');
    });

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.remove('hidden');

    // Add active class to clicked button
    event.target.classList.remove('text-white/80', 'hover:text-white', 'hover:bg-white/20');
    event.target.classList.add('text-white', 'bg-primary-600', 'shadow-lg', 'transform', 'scale-105');

    // Load content based on tab
    if (tabName === 'view') {
        loadAllFeedback();
    } else if (tabName === 'averages') {
        loadProductAverages();
    }
}

// Message system
function showMessage(message, type = 'success') {
    const messageEl = document.getElementById('message');
    const bgColor = type === 'success' ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600';
    const icon = type === 'success' ? '✅' : '❌';

    messageEl.innerHTML = `
        <div class="bg-gradient-to-r ${bgColor} text-white px-8 py-4 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105">
            <div class="flex items-center space-x-3">
                <span class="text-xl">${icon}</span>
                <span class="font-semibold">${message}</span>
            </div>
        </div>
    `;

    messageEl.classList.remove('translate-x-full');

    setTimeout(() => {
        messageEl.classList.add('translate-x-full');
    }, 4000);
}

// Form submission
document.getElementById('feedback-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        product_id: document.getElementById('product-id').value,
        score: parseFloat(document.getElementById('score').value),
        comment: document.getElementById('comment').value || null
    };

    try {
        const response = await fetch(`${API_BASE}/feedback/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showMessage('🎉 Feedback submitted successfully!');
            document.getElementById('feedback-form').reset();
        } else {
            const error = await response.json();
            showMessage(error.detail || '⚠️ Error submitting feedback', 'error');
        }
    } catch (error) {
        showMessage('🌐 Network error occurred', 'error');
        console.error('Error:', error);
    }
});

// Load all feedback
async function loadAllFeedback() {
    const feedbackList = document.getElementById('feedback-list');
    feedbackList.innerHTML = '<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-l-transparent"></div><p class="text-white/80 mt-4 text-lg">Loading feedback...</p></div>';

    try {
        const response = await fetch(`${API_BASE}/feedback/`);
        const feedback = await response.json();

        feedbackList.innerHTML = '';

        if (feedback.length === 0) {
            feedbackList.innerHTML = `
                <div class="text-center py-16">
                    <div class="text-6xl mb-4">📭</div>
                    <p class="text-white/80 text-xl font-medium">No feedback entries found.</p>
                    <p class="text-white/60 mt-2">Be the first to submit feedback!</p>
                </div>
            `;
            return;
        }

        feedback.forEach(item => {
            const feedbackItem = document.createElement('div');
            feedbackItem.className = 'glass-effect rounded-2xl p-6 card-hover';
            feedbackItem.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="bg-primary-500/30 rounded-full p-2">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                        <span class="font-bold text-white text-lg">Product: ${item.product_id}</span>
                    </div>
                    <span class="score-badge ${getScoreClasses(item.score)} font-bold text-lg px-4 py-2 rounded-full">
                        ⭐ ${item.score}/5
                    </span>
                </div>
                ${item.comment ? `
                    <div class="bg-white/10 rounded-xl p-4 mb-4">
                        <p class="text-white/90 italic">"${item.comment}"</p>
                    </div>
                ` : ''}
                <div class="flex justify-between items-center">
                    <small class="text-white/60 flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>${new Date(item.created_at).toLocaleDateString()}</span>
                    </small>
                    <button onclick="deleteFeedback(${item.id}, '${item.product_id}')" 
                            class="bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105">
                        🗑️ Delete
                    </button>
                </div>
            `;
            feedbackList.appendChild(feedbackItem);
        });
    } catch (error) {
        showMessage('⚠️ Error loading feedback', 'error');
        console.error('Error:', error);
        feedbackList.innerHTML = `
            <div class="text-center py-16">
                <div class="text-6xl mb-4">❌</div>
                <p class="text-white/80 text-xl font-medium">Error loading feedback</p>
            </div>
        `;
    }
}

// Filter feedback by product
async function filterFeedback() {
    const productId = document.getElementById('product-filter').value.trim();

    if (!productId) {
        loadAllFeedback();
        return;
    }

    const feedbackList = document.getElementById('feedback-list');
    feedbackList.innerHTML = '<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-l-transparent"></div><p class="text-white/80 mt-4 text-lg">Filtering feedback...</p></div>';

    try {
        const response = await fetch(`${API_BASE}/feedback/product/${productId}`);

        if (response.ok) {
            const feedback = await response.json();
            feedbackList.innerHTML = '';

            if (feedback.length === 0) {
                feedbackList.innerHTML = `
                    <div class="text-center py-16">
                        <div class="text-6xl mb-4">🔍</div>
                        <p class="text-white/80 text-xl font-medium">No feedback found for this product.</p>
                        <p class="text-white/60 mt-2">Try a different product ID</p>
                    </div>
                `;
                return;
            }

            feedback.forEach(item => {
                const feedbackItem = document.createElement('div');
                feedbackItem.className = 'glass-effect rounded-2xl p-6 card-hover';
                feedbackItem.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="bg-primary-500/30 rounded-full p-2">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                </svg>
                            </div>
                            <span class="font-bold text-white text-lg">Product: ${item.product_id}</span>
                        </div>
                        <span class="score-badge ${getScoreClasses(item.score)} font-bold text-lg px-4 py-2 rounded-full">
                            ⭐ ${item.score}/5
                        </span>
                    </div>
                    ${item.comment ? `
                        <div class="bg-white/10 rounded-xl p-4 mb-4">
                            <p class="text-white/90 italic">"${item.comment}"</p>
                        </div>
                    ` : ''}
                    <div class="flex justify-between items-center">
                        <small class="text-white/60 flex items-center space-x-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"></path>
                            </svg>
                            <span>${new Date(item.created_at).toLocaleDateString()}</span>
                        </small>
                        <button onclick="deleteFeedback(${item.id}, '${item.product_id}')" 
                                class="bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105">
                            🗑️ Delete
                        </button>
                    </div>
                `;
                feedbackList.appendChild(feedbackItem);
            });
        } else {
            showMessage('🔍 No feedback found for this product', 'error');
            feedbackList.innerHTML = `
                <div class="text-center py-16">
                    <div class="text-6xl mb-4">🔍</div>
                    <p class="text-white/80 text-xl font-medium">No feedback found for this product.</p>
                </div>
            `;
        }
    } catch (error) {
        showMessage('⚠️ Error filtering feedback', 'error');
        console.error('Error:', error);
    }
}

// Load product averages
async function loadProductAverages() {
    const averagesList = document.getElementById('averages-list');
    averagesList.innerHTML = '<div class="text-center py-12"><div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-l-transparent"></div><p class="text-white/80 mt-4 text-lg">Loading averages...</p></div>';

    try {
        const response = await fetch(`${API_BASE}/feedback/averages/`);
        const averages = await response.json();

        averagesList.innerHTML = '';

        if (averages.length === 0) {
            averagesList.innerHTML = `
                <div class="text-center py-16">
                    <div class="text-6xl mb-4">📊</div>
                    <p class="text-white/80 text-xl font-medium">No averages available.</p>
                    <p class="text-white/60 mt-2">Submit some feedback first!</p>
                </div>
            `;
            return;
        }

        averages.forEach(avg => {
            const avgItem = document.createElement('div');
            avgItem.className = 'glass-effect rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center card-hover';
            avgItem.innerHTML = `
                <div class="flex items-center space-x-4 mb-4 md:mb-0">
                    <div class="bg-accent-500/30 rounded-full p-3">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-bold text-white text-2xl">Product: ${avg.product_id}</h3>
                        <p class="text-white/70 text-lg flex items-center space-x-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            <span>${avg.feedback_count} feedback entries</span>
                        </p>
                    </div>
                </div>
                <div class="text-center">
                    <div class="score-badge ${getScoreClasses(avg.average_score)} text-4xl font-bold px-8 py-4 rounded-2xl shadow-lg">
                        ⭐ ${avg.average_score}/5
                    </div>
                </div>
            `;
            averagesList.appendChild(avgItem);
        });
    } catch (error) {
        showMessage('⚠️ Error loading averages', 'error');
        console.error('Error:', error);
        averagesList.innerHTML = `
            <div class="text-center py-16">
                <div class="text-6xl mb-4">❌</div>
                <p class="text-white/80 text-xl font-medium">Error loading averages</p>
            </div>
        `;
    }
}

function getScoreClasses(score) {
    if (score >= 4.0) {
        return 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-green-500/30';
    } else if (score >= 3.0) {
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-yellow-500/30';
    } else {
        return 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-red-500/30';
    }
}

async function deleteFeedback(feedbackId, productId) {
    try {
        const response = await fetch(`${API_BASE}/feedback/${feedbackId}?product_id=${productId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            showMessage('🗑️ Feedback deleted successfully!');
            loadAllFeedback(); // Reload feedback after deletion
        } else {
            const error = await response.json();
            showMessage(error.detail || '⚠️ Error deleting feedback', 'error');
        }
    } catch (error) {
        showMessage('🌐 Network error occurred', 'error');
        console.error('Error:', error);
    }
}
