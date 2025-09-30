const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Ensure chat_history directory exists
const CHAT_HISTORY_DIR = path.join(__dirname, '..', 'chat_history');

async function ensureChatHistoryDir() {
    try {
        await fs.access(CHAT_HISTORY_DIR);
    } catch (error) {
        await fs.mkdir(CHAT_HISTORY_DIR, { recursive: true });
    }
}

// Save chat to file
router.post('/save-chat', async (req, res) => {
    try {
        await ensureChatHistoryDir();
        
        const chatData = req.body;
        const filename = `${chatData.chatId}.json`;
        const filepath = path.join(CHAT_HISTORY_DIR, filename);
        
        await fs.writeFile(filepath, JSON.stringify(chatData, null, 2));
        
        res.json({ success: true, message: 'Chat saved successfully', chatId: chatData.chatId });
    } catch (error) {
        console.error('Error saving chat:', error);
        res.status(500).json({ error: 'Failed to save chat' });
    }
});

// Load specific chat
router.get('/load-chat/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const filepath = path.join(CHAT_HISTORY_DIR, `${chatId}.json`);
        
        const data = await fs.readFile(filepath, 'utf8');
        const chatData = JSON.parse(data);
        
        res.json(chatData);
    } catch (error) {
        console.error('Error loading chat:', error);
        res.status(404).json({ error: 'Chat not found' });
    }
});

// Get chat history list
router.get('/chat-history', async (req, res) => {
    try {
        await ensureChatHistoryDir();
        
        const files = await fs.readdir(CHAT_HISTORY_DIR);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const chatHistory = [];
        
        for (const file of jsonFiles) {
            try {
                const filepath = path.join(CHAT_HISTORY_DIR, file);
                const data = await fs.readFile(filepath, 'utf8');
                const chatData = JSON.parse(data);
                
                // Only include metadata for the list
                chatHistory.push({
                    chatId: chatData.chatId,
                    title: chatData.title,
                    savedAt: chatData.savedAt,
                    messageCount: chatData.messageCount
                });
            } catch (error) {
                console.error(`Error reading chat file ${file}:`, error);
            }
        }
        
        // Sort by savedAt date (newest first)
        chatHistory.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        
        res.json(chatHistory);
    } catch (error) {
        console.error('Error loading chat history:', error);
        res.status(500).json({ error: 'Failed to load chat history' });
    }
});

// Delete specific chat
router.delete('/delete-chat/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const filepath = path.join(CHAT_HISTORY_DIR, `${chatId}.json`);
        
        await fs.unlink(filepath);
        
        res.json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(404).json({ error: 'Chat not found' });
    }
});

// Clear all chat history
router.delete('/clear-chat-history', async (req, res) => {
    try {
        await ensureChatHistoryDir();
        
        const files = await fs.readdir(CHAT_HISTORY_DIR);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
            const filepath = path.join(CHAT_HISTORY_DIR, file);
            await fs.unlink(filepath);
        }
        
        res.json({ success: true, message: 'All chat history cleared' });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
});

module.exports = router;