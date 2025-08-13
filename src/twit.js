// Twitter API base URL
const API_BASE = 'https://tweets.nunosempere.com/api';

// DOM elements
const healthCheckBtn = document.getElementById('health-check');
const healthResultDiv = document.getElementById('health-result');

const addUsernameInput = document.getElementById('add-username');
const addListInput = document.getElementById('add-list');
const addAccountBtn = document.getElementById('add-account');
const getAccountsBtn = document.getElementById('get-accounts');
const deleteUsernameInput = document.getElementById('delete-username');
const deleteAccountBtn = document.getElementById('delete-account');
const accountResultDiv = document.getElementById('account-result');

const tweetsLimitInput = document.getElementById('tweets-limit');
const tweetsListInput = document.getElementById('tweets-list');
const getAllTweetsBtn = document.getElementById('get-all-tweets');
const userTweetsUsernameInput = document.getElementById('user-tweets-username');
const userTweetsLimitInput = document.getElementById('user-tweets-limit');
const getUserTweetsBtn = document.getElementById('get-user-tweets');
const tweetsResultDiv = document.getElementById('tweets-result');

const filterQuestionInput = document.getElementById('filter-question');
const filterUsersInput = document.getElementById('filter-users');
const filterTweetsBtn = document.getElementById('filter-tweets');
const filterResultDiv = document.getElementById('filter-result');

// Helper functions
function showError(container, message) {
    container.innerHTML = `<div class="error">${message}</div>`;
    container.classList.add('show');
}

function showSuccess(container, message) {
    container.innerHTML = `<div class="success">${message}</div>`;
    container.classList.add('show');
}

function showResults(container, html) {
    container.innerHTML = html;
    container.classList.add('show');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function truncateText(text, maxLength = 100) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        console.log(data)
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Health Check Handler
healthCheckBtn.addEventListener('click', async () => {
    healthCheckBtn.disabled = true;
    healthCheckBtn.textContent = 'Checking...';
    
    try {
        const result = await apiRequest('/health');
        console.log(result)
        showSuccess(healthResultDiv, `✅ Server is healthy; status: ${result.status}`);
    } catch (error) {
        showError(healthResultDiv, `❌ Health check failed: ${error.message}`);
    } finally {
        healthCheckBtn.disabled = false;
        healthCheckBtn.textContent = 'Check Server Health';
    }
});

// Add Account Handler
addAccountBtn.addEventListener('click', async () => {
    const username = addUsernameInput.value.trim();
    const list = addListInput.value.trim();
    
    if (!username) {
        showError(accountResultDiv, 'Please enter a username.');
        return;
    }
    
    addAccountBtn.disabled = true;
    addAccountBtn.textContent = 'Adding...';
    
    try {
        const body = { username };
        if (list) body.list = list;
        
        const result = await apiRequest('/accounts', {
            method: 'POST',
            body: JSON.stringify(body)
        });
        
        showSuccess(accountResultDiv, `✅ ${result.message}`);
        addUsernameInput.value = '';
        addListInput.value = '';
    } catch (error) {
        showError(accountResultDiv, `❌ Failed to add account: ${error.message}`);
    } finally {
        addAccountBtn.disabled = false;
        addAccountBtn.textContent = 'Add Account';
    }
});

// Get All Accounts Handler
getAccountsBtn.addEventListener('click', async () => {
    getAccountsBtn.disabled = true;
    getAccountsBtn.textContent = 'Loading...';
    
    try {
        const result = await apiRequest('/accounts');
        
        if (result.data && result.data.length > 0) {
            let html = '<h3>All Accounts</h3><ul class="results-list">';
            result.data.forEach(account => {
                html += `
                    <li>
                        <span class="method-name">@${account.username}</span>
                        <span class="method-value">${account.list || 'no list'}</span>
                    </li>
                `;
            });
            html += '</ul>';
            showResults(accountResultDiv, html);
        } else {
            showSuccess(accountResultDiv, 'No accounts found in database.');
        }
    } catch (error) {
        showError(accountResultDiv, `❌ Failed to get accounts: ${error.message}`);
    } finally {
        getAccountsBtn.disabled = false;
        getAccountsBtn.textContent = 'Get All Accounts';
    }
});

// Delete Account Handler
deleteAccountBtn.addEventListener('click', async () => {
    const username = deleteUsernameInput.value.trim();
    
    if (!username) {
        showError(accountResultDiv, 'Please enter a username to delete.');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete account @${username}?`)) {
        return;
    }
    
    deleteAccountBtn.disabled = true;
    deleteAccountBtn.textContent = 'Deleting...';
    
    try {
        const result = await apiRequest(`/accounts/${username}`, {
            method: 'DELETE'
        });
        
        showSuccess(accountResultDiv, `✅ ${result.message}`);
        deleteUsernameInput.value = '';
    } catch (error) {
        showError(accountResultDiv, `❌ Failed to delete account: ${error.message}`);
    } finally {
        deleteAccountBtn.disabled = false;
        deleteAccountBtn.textContent = 'Delete Account';
    }
});

// Get All Tweets Handler
getAllTweetsBtn.addEventListener('click', async () => {
    const limit = parseInt(tweetsLimitInput.value) || 100;
    const list = tweetsListInput.value.trim();
    
    getAllTweetsBtn.disabled = true;
    getAllTweetsBtn.textContent = 'Loading...';
    
    try {
        let endpoint = `/tweets?limit=${limit}`;
        if (list) endpoint += `&list=${encodeURIComponent(list)}`;
        
        const result = await apiRequest(endpoint);
        
        if (result.data && result.data.length > 0) {
            let html = `<h3>Tweets (${result.data.length})</h3>`;
            html += '<div style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px;">';
            
            result.data.forEach(tweet => {
                html += `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin-bottom: 10px;">
                        <div style="font-weight: bold; color: #1a1a1a;">@${tweet.username}</div>
                        <div style="margin: 5px 0; line-height: 1.4;">${truncateText(tweet.text, 200)}</div>
                        <div style="font-size: 0.9em; color: #666;">${formatDate(tweet.created_at)}</div>
                    </div>
                `;
            });
            
            html += '</div>';
            showResults(tweetsResultDiv, html);
        } else {
            showSuccess(tweetsResultDiv, 'No tweets found.');
        }
    } catch (error) {
        showError(tweetsResultDiv, `❌ Failed to get tweets: ${error.message}`);
    } finally {
        getAllTweetsBtn.disabled = false;
        getAllTweetsBtn.textContent = 'Get All Tweets';
    }
});

// Get User Tweets Handler
getUserTweetsBtn.addEventListener('click', async () => {
    const username = userTweetsUsernameInput.value.trim();
    const limit = parseInt(userTweetsLimitInput.value) || 50;
    
    if (!username) {
        showError(tweetsResultDiv, 'Please enter a username.');
        return;
    }
    
    getUserTweetsBtn.disabled = true;
    getUserTweetsBtn.textContent = 'Loading...';
    
    try {
        const result = await apiRequest(`/tweets/${username}?limit=${limit}`);
        
        if (result.data && result.data.length > 0) {
            let html = `<h3>Tweets from @${username} (${result.data.length})</h3>`;
            html += '<div style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px;">';
            
            result.data.forEach(tweet => {
                html += `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin-bottom: 10px;">
                        <div style="margin: 5px 0; line-height: 1.4;">${truncateText(tweet.text, 200)}</div>
                        <div style="font-size: 0.9em; color: #666;">${formatDate(tweet.created_at)}</div>
                    </div>
                `;
            });
            
            html += '</div>';
            showResults(tweetsResultDiv, html);
        } else {
            showSuccess(tweetsResultDiv, `No tweets found for @${username}.`);
        }
    } catch (error) {
        showError(tweetsResultDiv, `❌ Failed to get tweets for @${username}: ${error.message}`);
    } finally {
        getUserTweetsBtn.disabled = false;
        getUserTweetsBtn.textContent = 'Get User Tweets';
    }
});

// Filter Tweets Handler
filterTweetsBtn.addEventListener('click', async () => {
    const question = filterQuestionInput.value.trim();
    const usersText = filterUsersInput.value.trim();
    
    if (!question) {
        showError(filterResultDiv, 'Please enter a filter question.');
        return;
    }
    
    if (!usersText) {
        showError(filterResultDiv, 'Please enter at least one username.');
        return;
    }
    
    const users = usersText.split('\n').map(u => u.trim()).filter(u => u);
    
    if (users.length === 0) {
        showError(filterResultDiv, 'Please enter valid usernames.');
        return;
    }
    
    filterTweetsBtn.disabled = true;
    filterTweetsBtn.textContent = 'Filtering...';
    
    try {
        const result = await apiRequest('/filter', {
            method: 'POST',
            body: JSON.stringify({
                question: question,
                users: users
            })
        });
        
        if (result.data && result.data.filtered_tweets) {
            const filtered = result.data.filtered_tweets;
            const passing = filtered.filter(item => item.pass);
            const failing = filtered.filter(item => !item.pass);
            
            let html = `<h3>Filter Results</h3>`;
            html += `<p><strong>Question:</strong> "${result.data.question}"</p>`;
            html += `<p><strong>Total tweets processed:</strong> ${filtered.length}</p>`;
            html += `<p><strong>Passing tweets:</strong> ${passing.length}</p>`;
            
            if (passing.length > 0) {
                html += '<h4 style="color: #2e7d32; margin-top: 20px;">✅ Passing Tweets</h4>';
                html += '<div style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px; margin-bottom: 20px;">';
                
                passing.forEach(item => {
                    html += `
                        <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin-bottom: 10px;">
                            <div style="font-weight: bold; color: #1a1a1a;">@${item.tweet.username}</div>
                            <div style="margin: 5px 0; line-height: 1.4;">${truncateText(item.tweet.text, 150)}</div>
                            <div style="font-size: 0.9em; color: #666; margin: 5px 0;">${formatDate(item.tweet.created_at)}</div>
                            <div style="font-size: 0.85em; color: #2e7d32; font-style: italic;">Reasoning: ${item.reasoning}</div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            if (failing.length > 0 && failing.length <= 10) {
                html += '<h4 style="color: #d32f2f; margin-top: 20px;">❌ Non-Passing Tweets (sample)</h4>';
                html += '<div style="max-height: 200px; overflow-y: auto; border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px;">';
                
                failing.slice(0, 5).forEach(item => {
                    html += `
                        <div style="border-bottom: 1px solid #eee; padding: 8px 0; margin-bottom: 8px;">
                            <div style="font-weight: bold; color: #1a1a1a;">@${item.tweet.username}</div>
                            <div style="margin: 3px 0; line-height: 1.4; font-size: 0.9em;">${truncateText(item.tweet.text, 100)}</div>
                            <div style="font-size: 0.8em; color: #d32f2f; font-style: italic;">Reasoning: ${item.reasoning}</div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            showResults(filterResultDiv, html);
        } else {
            showSuccess(filterResultDiv, 'No tweets found to filter.');
        }
    } catch (error) {
        showError(filterResultDiv, `❌ Failed to filter tweets: ${error.message}`);
    } finally {
        filterTweetsBtn.disabled = false;
        filterTweetsBtn.textContent = 'Filter Tweets';
    }
});

// Keyboard shortcuts
addUsernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addAccountBtn.click();
    }
});

addListInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addAccountBtn.click();
    }
});

deleteUsernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        deleteAccountBtn.click();
    }
});

userTweetsUsernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getUserTweetsBtn.click();
    }
});

filterQuestionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        filterTweetsBtn.click();
    }
});

filterUsersInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        filterTweetsBtn.click();
    }
});
