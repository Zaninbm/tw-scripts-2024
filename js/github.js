// version 1.0
async function loadAndExecuteScript(apiUrl) {
    try {
        // Fetch the file content from GitHub API
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch script: ' + response.statusText);

        // Parse the JSON response
        const jsonData = await response.json();

        // Decode the base64 content to plain text if it exists
        const scriptContent = jsonData.content ? atob(jsonData.content.replace(/\n/g, '')) : '';

        // Create a new script element
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptContent;

        // Append the script element to the document to execute it
        document.body.appendChild(scriptElement);
        console.log('Script loaded and executed successfully.');
    } catch (error) {
        console.error('Error loading or executing script:', error);
    }
}

// GitHub API endpoint for the specific JavaScript file
const gitHubApiUrl = 'https://api.github.com/repos/novotny-patrik/tw-scripts/contents/js/twb.js';

// Call the function with the GitHub API URL
loadAndExecuteScript(gitHubApiUrl);