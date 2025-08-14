// Twitter API base URL
const API_BASE = 'http://localhost:3343/api' // 'https://tweets.nunosempere.com/api';

// DOM elements
const healthCheckBtn = document.getElementById('health-check');
const healthResultDiv = document.getElementById('health-result');

const addUsernameInput = document.getElementById('add-username');
const addListInput = document.getElementById('add-list');
const addAccountBtn = document.getElementById('add-account');
const showAccountsBtn = document.getElementById('show-accounts');
const hideAccountsBtn = document.getElementById('hide-accounts');
const accountResultDiv = document.getElementById('account-result');

const tweetsLimitInput = document.getElementById('tweets-limit');
const tweetsListInput = document.getElementById('tweets-list');
const getAllTweetsBtn = document.getElementById('get-all-tweets');
const userTweetsUsernameInput = document.getElementById('user-tweets-username');
const userTweetsLimitInput = document.getElementById('user-tweets-limit');
const getUserTweetsBtn = document.getElementById('get-user-tweets');
const tweetsResultDiv = document.getElementById('tweets-result');
const userTweetsResultDiv = document.getElementById('user-tweets-result');
const hideAllTweetsBtn = document.getElementById('hide-all-tweets');
const hideUserTweetsBtn = document.getElementById('hide-user-tweets');

const filterQuestionInput = document.getElementById('filter-question');
const filterListInput = document.getElementById('filter-list');
const filterUsersInput = document.getElementById('filter-users');
const filterTweetsBtn = document.getElementById('filter-tweets');
const hideFilterResultsBtn = document.getElementById('hide-filter-results');
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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

// Show Monitored Accounts Handler
showAccountsBtn.addEventListener('click', async () => {
    showAccountsBtn.disabled = true;
    showAccountsBtn.textContent = 'Loading...';
    
    try {
        const result = await apiRequest('/accounts');
        
        if (result.data && result.data.length > 0) {
            let html = '<h3>Monitored Accounts</h3><ul class="results-list">';
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
            showAccountsBtn.style.display = 'none';
            hideAccountsBtn.style.display = 'inline-block';
        } else {
            showResults(accountResultDiv, '<h3>Monitored Accounts</h3><p>No accounts found in database.</p>');
            showAccountsBtn.style.display = 'none';
            hideAccountsBtn.style.display = 'inline-block';
        }
    } catch (error) {
        showError(accountResultDiv, `❌ Failed to get accounts: ${error.message}`);
    } finally {
        showAccountsBtn.disabled = false;
        showAccountsBtn.textContent = 'Show Monitored Accounts';
    }
});

// Hide Accounts Handler
hideAccountsBtn.addEventListener('click', () => {
    accountResultDiv.classList.remove('show');
    accountResultDiv.innerHTML = '';
    showAccountsBtn.style.display = 'inline-block';
    hideAccountsBtn.style.display = 'none';
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
        console.log(result)
        
        if (result.data.tweets && result.data.tweets.length > 0) {
            let html = `<h3>Tweets (${result.data.tweets.length})</h3>`;
            html += '<div style="border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px;">';
            
            result.data.tweets.forEach(tweet => {
                html += `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin-bottom: 10px;">
                        <div style="font-weight: bold; color: #1a1a1a;">@${tweet.username}</div>
                        <div style="margin: 5px 0; line-height: 1.4;">${tweet.text}</div>
                        <div style="font-size: 0.9em; color: #666;"><a href="https://twitter.com/i/web/status/${tweet.tweet_id}" target="_blank" style="color: #1da1f2; text-decoration: none;">${formatDate(tweet.created_at)}</a></div>
                    </div>
                `;
            });
            
            html += '</div>';
            showResults(tweetsResultDiv, html);
            hideAllTweetsBtn.style.display = 'inline-block';
            hideAllTweetsBtn.textContent = 'Hide Results';
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
        showError(userTweetsResultDiv, 'Please enter a username.');
        return;
    }
    
    getUserTweetsBtn.disabled = true;
    getUserTweetsBtn.textContent = 'Loading...';
    
    try {
        const result = await apiRequest(`/tweets/${username}?limit=${limit}`);
        
        if (result.data.tweets && result.data.tweets.length > 0) {
            let html = `<h3>Tweets from @${username} (${result.data.tweets.length})</h3>`;
            html += '<div style="border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px;">';
            
            result.data.tweets.forEach(tweet => {
                html += `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin-bottom: 10px;">
                        <div style="margin: 5px 0; line-height: 1.4;">${tweet.text}</div>
                        <div style="font-size: 0.9em; color: #666;"><a href="https://twitter.com/i/web/status/${tweet.tweet_id}" target="_blank" style="color: #1da1f2; text-decoration: none;">${formatDate(tweet.created_at)}</a></div>
                    </div>
                `;
            });
            
            html += '</div>';
            showResults(userTweetsResultDiv, html);
            hideUserTweetsBtn.style.display = 'inline-block';
            hideUserTweetsBtn.textContent = 'Hide Results';
        } else {
            showSuccess(userTweetsResultDiv, `No tweets found for @${username}.`);
        }
    } catch (error) {
        showError(userTweetsResultDiv, `❌ Failed to get tweets for @${username}: ${error.message}`);
    } finally {
        getUserTweetsBtn.disabled = false;
        getUserTweetsBtn.textContent = 'Get User Tweets';
    }
});

// Filter Tweets Handler (WebSocket)
filterTweetsBtn.addEventListener('click', async () => {
    const question = filterQuestionInput.value.trim();
    const list = filterListInput.value.trim();
    const usersText = filterUsersInput.value.trim();
    
    if (!question) {
        showError(filterResultDiv, 'Please enter a filter question.');
        return;
    }
    
    if (!list && !usersText) {
        showError(filterResultDiv, 'Please enter either a list name or usernames.');
        return;
    }
    
    if (list && usersText) {
        showError(filterResultDiv, 'Please provide either a list name OR usernames, not both.');
        return;
    }
    
    filterTweetsBtn.disabled = true;
    filterTweetsBtn.textContent = 'Connecting...';
    
    // Show initial progress
    showResults(filterResultDiv, '<div id="filter-progress"><p>🔌 Connecting to server...</p></div>');
    
    try {
        const requestBody = { question: question };
        
        if (list) {
            requestBody.list = list;
        } else {
            const users = usersText.split('\n').map(u => u.trim()).filter(u => u);
            if (users.length === 0) {
                showError(filterResultDiv, 'Please enter valid usernames.');
                filterTweetsBtn.disabled = false;
                filterTweetsBtn.textContent = 'Filter Tweets';
                return;
            }
            requestBody.users = users;
        }
        
        // Create WebSocket connection
        const wsUrl = API_BASE.replace('https://', 'wss://').replace('http://', 'ws://') + '/filter-ws';
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            filterTweetsBtn.textContent = 'Filtering...';
            showResults(filterResultDiv, '<div id="filter-progress"><p>🚀 Starting tweet filtering...</p></div>');
            // Send filter request
            ws.send(JSON.stringify(requestBody));
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'progress':
                    const progressHtml = `
                        <div id="filter-progress">
                            <p>🔄 Processing tweets: ${message.data.processed}/${message.data.total}</p>
                            <div style="background: #f0f0f0; border-radius: 10px; overflow: hidden; margin: 10px 0;">
                                <div style="background: #4caf50; height: 20px; width: ${(message.data.processed / message.data.total * 100)}%; transition: width 0.3s ease;"></div>
                            </div>
                            <p style="font-size: 0.9em; color: #666;">${message.data.message}</p>
                        </div>
                    `;
                    showResults(filterResultDiv, progressHtml);
                    break;
                    
                case 'result':
                    ws.close();
                    displayFilterResults(message.data);
                    break;
                    
                case 'error':
                    ws.close();
                    showError(filterResultDiv, `❌ Filtering failed: ${message.data.error}`);
                    break;
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            showError(filterResultDiv, '❌ Connection error. Please try again.');
            filterTweetsBtn.disabled = false;
            filterTweetsBtn.textContent = 'Filter Tweets';
        };
        
        ws.onclose = (event) => {
            filterTweetsBtn.disabled = false;
            filterTweetsBtn.textContent = 'Filter Tweets';
            
            if (event.code !== 1000 && event.code !== 1001) {
                console.error('WebSocket closed unexpectedly:', event.code, event.reason);
                if (!filterResultDiv.innerHTML.includes('Filter Results')) {
                    showError(filterResultDiv, '❌ Connection lost. Please try again.');
                }
            }
        };
        
    } catch (error) {
        showError(filterResultDiv, `❌ Failed to start filtering: ${error.message}`);
        filterTweetsBtn.disabled = false;
        filterTweetsBtn.textContent = 'Filter Tweets';
    }
});

// Helper function to display filter results
function displayFilterResults(result) {
    if (result && result.filtered_tweets) {
        const filtered = result.filtered_tweets;
        const passing = filtered.filter(item => item.pass);
        const failing = filtered.filter(item => !item.pass);
        
        let html = `<h3>✅ Filter Results</h3>`;
        html += `<p><strong>Question:</strong> "${result.question}"</p>`;
        html += `<p><strong>Total tweets processed:</strong> ${filtered.length}</p>`;
        html += `<p><strong>Passing tweets:</strong> ${passing.length}</p>`;
        
        if (passing.length > 0) {
            html += '<h4 style="color: #2e7d32; margin-top: 20px;">✅ Passing Tweets</h4>';
            html += '<div style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px; margin-bottom: 20px;">';
            
            passing.forEach(item => {
                html += `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin-bottom: 10px;">
                        <div style="font-weight: bold; color: #1a1a1a;">@${item.tweet.username}</div>
                        <div style="margin: 5px 0; line-height: 1.4;">${item.tweet.text}</div>
                        <div style="font-size: 0.9em; color: #666; margin: 5px 0;"><a href="https://twitter.com/i/web/status/${item.tweet.tweet_id}" target="_blank" style="color: #1da1f2; text-decoration: none;">${formatDate(item.tweet.created_at)}</a></div>
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
                        <div style="margin: 3px 0; line-height: 1.4; font-size: 0.9em;">${item.tweet.text}</div>
                        <div style="font-size: 0.8em; color: #d32f2f; font-style: italic;">Reasoning: ${item.reasoning}</div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        showResults(filterResultDiv, html);
        hideFilterResultsBtn.style.display = 'inline-block';
        hideFilterResultsBtn.textContent = 'Hide Results';
    } else {
        showSuccess(filterResultDiv, '✅ No tweets found to filter.');
    }
}

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

// Hide/Show All Tweets Handler
hideAllTweetsBtn.addEventListener('click', () => {
    if (tweetsResultDiv.classList.contains('show')) {
        tweetsResultDiv.classList.remove('show');
        hideAllTweetsBtn.textContent = 'Show Results';
    } else {
        tweetsResultDiv.classList.add('show');
        hideAllTweetsBtn.textContent = 'Hide Results';
    }
});

// Hide/Show User Tweets Handler
hideUserTweetsBtn.addEventListener('click', () => {
    if (userTweetsResultDiv.classList.contains('show')) {
        userTweetsResultDiv.classList.remove('show');
        hideUserTweetsBtn.textContent = 'Show Results';
    } else {
        userTweetsResultDiv.classList.add('show');
        hideUserTweetsBtn.textContent = 'Hide Results';
    }
});

// Hide/Show Filter Results Handler
hideFilterResultsBtn.addEventListener('click', () => {
    if (filterResultDiv.classList.contains('show')) {
        filterResultDiv.classList.remove('show');
        hideFilterResultsBtn.textContent = 'Show Results';
    } else {
        filterResultDiv.classList.add('show');
        hideFilterResultsBtn.textContent = 'Hide Results';
    }
});
