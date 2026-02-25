(function() {
    const vscode = acquireVsCodeApi();
    
    const messagesContainer = document.querySelector('.messages');
    const input = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');

    let isProcessing = false;

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'receiveMessage':
                isProcessing = false;
                removeLoadingIndicator();
                appendMessage(message.text, message.role, message.meta);
                break;
            case 'showLoading':
                isProcessing = true;
                appendLoadingIndicator();
                break;
        }
    });

    // Send message on button click or Enter
    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const text = input.value.trim();
        if (!text || isProcessing) return;

        input.value = '';
        appendMessage(text, 'user');
        vscode.postMessage({ command: 'sendMessage', text });
    }

    function appendMessage(text, role, meta) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        // Basic parsing for code blocks to add "Apply" buttons
        const parts = text.split(/(```[\s\S]*?```)/g);
        
        parts.forEach(part => {
            if (part.startsWith('```') && part.endsWith('```')) {
                // Extract code content
                const content = part.substring(3, part.length - 3).replace(/^[a-z]+\n/, ''); 
                
                const codeBlock = document.createElement('div');
                codeBlock.className = 'code-block';
                
                const pre = document.createElement('pre');
                pre.textContent = content.trim();
                
                const actions = document.createElement('div');
                actions.className = 'code-actions';
                
                const applyBtn = document.createElement('button');
                applyBtn.textContent = 'Apply to Editor';
                applyBtn.className = 'apply-btn';
                applyBtn.onclick = () => {
                    vscode.postMessage({
                        command: 'applyRefactoring',
                        code: content.trim(),
                        range: null // Default to active selection in editor
                    });
                };
                
                actions.appendChild(applyBtn);
                codeBlock.appendChild(pre);
                codeBlock.appendChild(actions);
                messageDiv.appendChild(codeBlock);
            } else {
                const p = document.createElement('p');
                p.textContent = part;
                messageDiv.appendChild(p);
            }
        });

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function appendLoadingIndicator() {
        const loader = document.createElement('div');
        loader.className = 'message assistant loading';
        loader.textContent = 'Thinking...';
        loader.id = 'loading-indicator';
        messagesContainer.appendChild(loader);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeLoadingIndicator() {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.remove();
    }
})();