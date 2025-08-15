// Twitter API base URL
// const API_BASE = 'http://localhost:3343/api' // 
const API_BASE = 'https://tweets.nunosempere.com/api';

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

// Parse markdown to HTML using marked library
function parseMarkdown(text) {
    if (!text || typeof marked === 'undefined') return text;
    return marked.parse(text);
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    try {
        const controller = new AbortController();
        // const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options,
            signal: controller.signal
        });
        
        // clearTimeout(timeoutId);
        
	console.log(response)
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
        showSuccess(healthResultDiv, `Server is healthy; status: ${result.status}`);
    } catch (error) {
        showError(healthResultDiv, `Health check failed: ${error.message}`);
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
        
        showSuccess(accountResultDiv, `${result.message}`);
        addUsernameInput.value = '';
        addListInput.value = '';
    } catch (error) {
        showError(accountResultDiv, `Failed to add account: ${error.message}`);
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
        showError(accountResultDiv, `Failed to get accounts: ${error.message}`);
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
        showError(tweetsResultDiv, `Failed to get tweets: ${error.message}`);
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
        showError(userTweetsResultDiv, `Failed to get tweets for @${username}: ${error.message}`);
    } finally {
        getUserTweetsBtn.disabled = false;
        getUserTweetsBtn.textContent = 'Get User Tweets';
    }
});

// Filter Tweets Handler (Polling)
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
    filterTweetsBtn.textContent = 'Starting...';
    
    // Show initial progress
    showResults(filterResultDiv, '<div id="filter-progress"><p>Creating filter job...</p></div>');
    
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
        
        // Create filter job
        const jobResponse = await apiRequest('/filter-job', {
            method: 'POST',
            body: JSON.stringify(requestBody),
            timeout: 60000 // 1 minute timeout for job creation
        });
        
        const jobId = jobResponse.data.job_id;
        filterTweetsBtn.textContent = 'Filtering...';
        showResults(filterResultDiv, '<div id="filter-progress"><p>Job created, starting polling...</p></div>');
        
        // Initialize results container
        window.currentFilterResults = null;
        
        // Start polling for job status
        await pollFilterJob(jobId);
        
    } catch (error) {
        showError(filterResultDiv, `Failed to start filtering: ${error.message}`);
        filterTweetsBtn.disabled = false;
        filterTweetsBtn.textContent = 'Filter Tweets';
    }
});

// Function to poll filter job status
async function pollFilterJob(jobId, retryCount = 0) {
    const maxRetries = 3;
    const maxAttempts = 300; // 5 minute timeout
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const statusResponse = await apiRequest(`/filter-job/${jobId}/status`, {
                timeout: 200 // 200ms timeout for status checks
            });
            
            const status = statusResponse.data;
            
            // Update progress display and show partial results if available
            if (status.progress) {
                const progressHtml = `
                    <div id="filter-progress">
                        <p>${status.progress.message || 'Processing tweets'}</p>
                        <p style="font-size: 0.9em; color: #666;">Status: ${status.status}</p>
                    </div>
                `;
                showResults(filterResultDiv, progressHtml);
            }
            
            // Show partial results while running
            if (status.status === 'running' && status.partial_results && status.partial_results.partial_tweets) {
                const partialResult = {
                    filtered_tweets: status.partial_results.partial_tweets,
                    summary: null // No summary yet while running
                };
                
                // Update stored results with partial data
                window.currentFilterResults = partialResult;
                
                // Display partial results with progress indicator
                displayPartialFilterResults(partialResult, status.progress);
            }
            
            if (status.status === 'completed') {
                // Job completed, get final results
                const resultsResponse = await apiRequest(`/filter-job/${jobId}/results`);
                if (resultsResponse.data && resultsResponse.data.results) {
                    window.currentFilterResults = resultsResponse.data.results;
                    // Display final results (replacing any partial results)
                    displayFilterResults(window.currentFilterResults);
                } else {
                    throw new Error('Job completed but no results available');
                }
                
                filterTweetsBtn.disabled = false;
                filterTweetsBtn.textContent = 'Filter Tweets';
                return;
            } else if (status.status === 'failed') {
                throw new Error(status.error_message || 'Job failed');
            }
            
            // Job still in progress, wait before next poll
            const delay = Math.min(1000 * Math.pow(1.5, attempts), 5000); // Exponential backoff up to 5s
            await new Promise(resolve => setTimeout(resolve, delay));
            attempts++;
            
        } catch (networkError) {
            console.warn(`Network error during polling (attempt ${retryCount + 1}):`, networkError);
            if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return pollFilterJob(jobId, retryCount + 1);
            } else {
                throw new Error(`Network error after ${maxRetries} retries: ${networkError.message}`);
            }
        }
    }
    
    throw new Error('Job timeout after 5 minutes');
}

// Helper function to display partial filter results while running
function displayPartialFilterResults(result, progress) {
    if (result && result.filtered_tweets) {
        const filtered = result.filtered_tweets;
        const passing = filtered.filter(item => item.pass);
        const failing = filtered.filter(item => !item.pass);
        
        let html = `<h3>Filter Results (Processing...)</h3>`;
        
        // Show progress bar
        if (progress) {
            html += `
                <div style="background: #f0f0f0; border-radius: 10px; overflow: hidden; margin: 10px 0;">
                    <div style="background: #4caf50; height: 20px; width: ${progress.percentage || 0}%; transition: width 0.3s ease;"></div>
                </div>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">${progress.message || 'Processing tweets'}: ${progress.current || 0}/${progress.total || 0}</p>
            `;
        }
        
        html += `<p><strong>Passing tweets so far:</strong> ${passing.length}</p>`;
        
        if (passing.length > 0) {
            html += '<h4 style="color: #2e7d32; margin-top: 20px;">Passing Tweets (Partial)</h4>';
            html += '<div style="border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px; margin-bottom: 20px;">';
            
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
        
        // Show sample of failing tweets if any
        if (failing.length > 0) {
            html += '<h4 style="color: #d32f2f; margin-top: 20px;">Non-Passing Tweets (Partial Sample)</h4>';
            html += '<div style="border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px;">';
            
            failing.slice(0, 3).forEach(item => {
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
    }
}

// Helper function to display filter results
function displayFilterResults(result) {
    if (result && result.filtered_tweets) {
        const filtered = result.filtered_tweets;
        const passing = filtered.filter(item => item.pass);
        const failing = filtered.filter(item => !item.pass);
        
        let html = `<h3>Filter Results</h3>`;
        html += `<p><strong>Passing tweets:</strong> ${passing.length}</p>`;
        
        // Show summary if available
        if (result.summary) {
            html += `<div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; border-radius: 4px;">`;
            html += `<h4 style="margin-top: 0; color: #495057;">Summary</h4>`;
            html += `<div style="margin-bottom: 0; line-height: 1.5;">${parseMarkdown(result.summary)}</div>`;
            html += `</div>`;
        }
        if (passing.length > 0) {
            html += '<h4 style="color: #2e7d32; margin-top: 20px;">Passing Tweets</h4>';
            html += '<div style="border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px; margin-bottom: 20px;">';
            
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
        
        if (failing.length > 0) {
            html += '<h4 style="color: #d32f2f; margin-top: 20px;">Non-Passing Tweets</h4>';
            html += '<div style="border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px;">';
            
            failing.forEach(item => {
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
        
        // Show sample of failing tweets if any
        if (failing.length > 0) {
            html += '<h4 style="color: #d32f2f; margin-top: 20px;">Non-Passing Tweets (Partial Sample)</h4>';
            html += '<div style="border: 1px solid #e5e5e5; padding: 10px; border-radius: 4px;">';
            
            failing.slice(0, 3).forEach(item => {
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
        showSuccess(filterResultDiv, 'No tweets found to filter.');
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
