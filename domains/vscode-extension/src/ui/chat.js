// @ts-ignore
const vscode = acquireVsCodeApi();

const messagesContainer = document.getElementById('messages');
const input = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const clearButton = document.getElementById('clear-button');

function sendMessage() {
    const text = input.value;
    if (text.trim().length > 0) {
        // Data's fix: UTF-8 safe Base64 encoding for VSCode postMessage
        const encodedText = Buffer.from(text, 'utf-8').toString('base64');
        vscode.postMessage({
            command: 'sendMessage', // The command remains the same
            text: encodedText,      // Send the encoded text
            encoding: 'base64-utf8' // Inform the extension host about the encoding
        });
        input.value = '';
        input.style.height = 'auto'; // Reset height
    }
}

sendButton.addEventListener('click', sendMessage);

clearButton.addEventListener('click', () => {
    messagesContainer.innerHTML = '';
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        sendMessage();
    }
});

input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = (input.scrollHeight) + 'px';
});

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'addMessage':
            addMessage(message.role, message.text, message.meta, message.isError, message.retryText);
            break;
        case 'setLoading':
            setLoading(message.value);
            break;
        case 'updateStatus':
            updateStatus(message.text);
            break;
    }
});

function addMessage(role, text, meta, isError, retryText) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', role);

    // Naive markdown to HTML for code blocks
    let htmlText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    htmlText = htmlText.replace(/```([\s\S]*?)```/g, (match, code) => {
        // Remove language identifier if present
        const cleanCode = code.replace(/^(typescript|javascript|python|bash|sh|json|html|css)\n/, '');
        return `<pre><code>${cleanCode}</code></pre>`;
    });

    messageElement.innerHTML = htmlText;

    if (isError && retryText) {
        const retryBtn = document.createElement('button');
        retryBtn.className = 'retry-btn';
        retryBtn.textContent = 'Retry';
        retryBtn.onclick = () => {
            vscode.postMessage({
                command: 'sendMessage',
                text: retryText
            });
        };
        messageElement.appendChild(retryBtn);
    }

    if (meta) {
        const metaElement = document.createElement('div');
        metaElement.classList.add('meta');
        
        const model = meta.model ? meta.model.split('/').pop() : 'unknown';
        const cost = meta.cost ? `$${meta.cost.toFixed(6)}` : '$0.00';
        const time = meta.time ? `${(meta.time / 1000).toFixed(2)}s` : 'N/A';

        metaElement.innerHTML = `
            <span>🤖 ${model}</span>
            <span>💰 ${cost}</span>
            <span>⏱️ ${time}</span>
        `;
        messageElement.appendChild(metaElement);
    }

    messagesContainer.appendChild(messageElement);

    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function setLoading(isLoading) {
    const loaderId = 'loading-indicator';
    const existingLoader = document.getElementById(loaderId);
    
    if (isLoading && !existingLoader) {
        const loader = document.createElement('div');
        loader.id = loaderId;
        loader.className = 'message assistant loading';
        loader.innerHTML = '<span>Thinking...</span>';
        messagesContainer.appendChild(loader);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else if (!isLoading && existingLoader) {
        existingLoader.remove();
    }
}

function updateStatus(text) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.querySelector('span').textContent = text;
    }
}