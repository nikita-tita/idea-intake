require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configuration
const PORT = process.env.PORT || 3000;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || 'claude-3-5-sonnet';

// Initialize Google Sheets API
let sheetsClient = null;

function initializeGoogleSheets() {
    try {
        const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (!keyFile) {
            throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set');
        }
        
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFile,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        sheetsClient = google.sheets({ version: 'v4', auth });
        console.log('Google Sheets client initialized');
    } catch (error) {
        console.error('Error initializing Google Sheets:', error);
    }
}

// Process idea with LLM
async function processIdeaWithLLM(ideaTitle, ideaDescription) {
    const prompt = `You are a business analyst. Analyze the following product idea and extract structured information for a Lean Canvas:

Idea Title: ${ideaTitle}
Idea Description: ${ideaDescription}

Respond ONLY with valid JSON (no markdown, no extra text) in this exact format:
{
  "problem": "the main problem this solves",
  "customer_segments": "target customer segments",
  "unique_value_proposition": "what makes this unique",
  "solution": "how the product solves the problem",
  "channels": "how users will find/access this",
  "revenue_streams": "how you'll make money",
  "cost_structure": "main cost drivers",
  "key_metrics": "key success metrics"
}

Ensure all values are strings and the JSON is valid.`;
    
    try {
        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: LLM_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${LLM_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/{[\s\S]*}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error processing with LLM:', error);
        // Return a default structure if LLM fails
        return {
            problem: ideaDescription.substring(0, 100),
            customer_segments: 'To be determined',
            unique_value_proposition: 'To be determined',
            solution: ideaTitle,
            channels: 'To be determined',
            revenue_streams: 'To be determined',
            cost_structure: 'To be determined',
            key_metrics: 'To be determined'
        };
    }
}

// Write to Google Sheets
async function writeToGoogleSheets(ideaData) {
    if (!sheetsClient) {
        throw new Error('Google Sheets client not initialized');
    }
    
    const ideaId = uuidv4().substring(0, 8);
    const now = new Date().toISOString();
    
    try {
        // Write to Ideas sheet
        await sheetsClient.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'Ideas!A:E',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    ideaId,
                    ideaData.ideaTitle,
                    now,
                    'processed',
                    ideaData.ideaDescription.substring(0, 500)
                ]]
            }
        });
        
        // Write to LeanCanvas sheet
        await sheetsClient.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'LeanCanvas!A:I',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    ideaId,
                    ideaData.problem || '',
                    ideaData.customer_segments || '',
                    ideaData.unique_value_proposition || '',
                    ideaData.solution || '',
                    ideaData.channels || '',
                    ideaData.revenue_streams || '',
                    ideaData.cost_structure || '',
                    ideaData.key_metrics || ''
                ]]
            }
        });
        
        console.log(`Idea ${ideaId} written to Google Sheets`);
        return ideaId;
    } catch (error) {
        console.error('Error writing to Google Sheets:', error);
        throw error;
    }
}

// API Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/ideas', async (req, res) => {
    try {
        const { ideaTitle, ideaDescription } = req.body;
        
        if (!ideaTitle || !ideaDescription) {
            return res.status(400).json({ error: 'ideaTitle and ideaDescription are required' });
        }
        
        console.log('Processing idea:', ideaTitle);
        
        // Process with LLM
        const leanCanvasData = await processIdeaWithLLM(ideaTitle, ideaDescription);
        
        // Combine with original data
        const fullData = {
            ideaTitle,
            ideaDescription,
            ...leanCanvasData
        };
        
        // Write to Google Sheets
        const ideaId = await writeToGoogleSheets(fullData);
        
        res.json({
            success: true,
            ideaId,
            message: 'Idea processed and saved successfully',
            data: fullData
        });
    } catch (error) {
        console.error('Error in /api/ideas:', error);
        res.status(500).json({
            error: 'Failed to process idea',
            details: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
initializeGoogleSheets();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Google Sheet ID: ${GOOGLE_SHEET_ID}`);
});

module.exports = app;
