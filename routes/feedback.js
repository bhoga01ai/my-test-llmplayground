const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Ensure feedback directory exists
const feedbackDir = path.join(__dirname, '../feedback');
if (!fs.existsSync(feedbackDir)) {
    fs.mkdirSync(feedbackDir, { recursive: true });
}

const feedbackFilePath = path.join(feedbackDir, 'feedback.csv');

// Initialize feedback CSV file if it doesn't exist
if (!fs.existsSync(feedbackFilePath)) {
    fs.writeFileSync(feedbackFilePath, 'timestamp,message_id,feedback,message\n');
}

// POST /api/feedback - Save user feedback
router.post('/', async (req, res) => {
    try {
        const { timestamp, messageId, feedback, message } = req.body;
        
        if (!timestamp || !messageId || !feedback) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Validate feedback type
        if (feedback !== 'positive' && feedback !== 'negative') {
            return res.status(400).json({ error: 'Invalid feedback type' });
        }
        
        // Escape double quotes in message content for CSV
        const escapedMessage = message ? message.replace(/"/g, '""') : '';
        
        // Format the feedback data as a CSV row
        const feedbackData = `${timestamp},${messageId},${feedback},"${escapedMessage}"\n`;
        
        // Append to the CSV file
        fs.appendFileSync(feedbackFilePath, feedbackData);
        
        logger.info(`Feedback saved: ${messageId} - ${feedback}`);
        
        return res.status(200).json({ success: true, message: 'Feedback saved successfully' });
    } catch (error) {
        logger.error('Error saving feedback:', error);
        return res.status(500).json({ error: 'Failed to save feedback' });
    }
});

module.exports = router;