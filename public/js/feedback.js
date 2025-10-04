/**
 * Add feedback functionality to the LLMPlayground class
 */
LLMPlayground.prototype.saveFeedback = function(messageId, feedback) {
    // Find the message element
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    // Highlight the selected feedback button
    const feedbackButtons = messageElement.querySelectorAll('.feedback-btn');
    feedbackButtons.forEach(btn => btn.classList.remove('selected'));
    
    const selectedButton = messageElement.querySelector(`.${feedback === 'positive' ? 'thumbs-up' : 'thumbs-down'}`);
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
    
    // Get the message content
    const contentElement = messageElement.querySelector('.message-content');
    const messageContent = contentElement ? contentElement.textContent.substring(0, 100) : '';
    
    // Prepare the feedback data
    const timestamp = new Date().toISOString();
    
    // Send the feedback to the server
    fetch('/api/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            timestamp,
            messageId,
            feedback,
            message: messageContent
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save feedback');
        }
        return response.json();
    })
    .then(data => {
        console.log('Feedback saved successfully:', data);
        this.showNotification('Thank you for your feedback!', 'success');
    })
    .catch(error => {
        console.error('Error saving feedback:', error);
        this.showNotification('Failed to save feedback. Please try again.', 'error');
    });
};