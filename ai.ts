import express from 'express';
import { aiCraftPizza, aiAnalyzeFlavor, aiChatLuigi, aiKitchenInsights } from '../ai';

const router = express.Router();

// 1. AI Pizza Crafter: generate recipe from prompt
router.post('/craft', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Please describe the pizza you are craving.' });
    }

    const result = await aiCraftPizza(prompt);
    res.json(result);
  } catch (err: any) {
    console.error('Error crafting pizza with AI:', err);
    res.status(500).json({ error: 'Failed to craft pizza with AI.' });
  }
});

// 2. AI Live Flavor Sommelier Analysis
router.post('/flavor-analysis', async (req, res) => {
  try {
    const { baseName, sauceName, cheeseName, vegetableNames } = req.body;
    if (!baseName || !sauceName || !cheeseName) {
      return res.status(400).json({ error: 'Base, sauce, and cheese names are required for analysis.' });
    }

    const result = await aiAnalyzeFlavor({
      baseName,
      sauceName,
      cheeseName,
      vegetableNames: Array.isArray(vegetableNames) ? vegetableNames : [],
    });
    res.json(result);
  } catch (err: any) {
    console.error('Error analyzing flavor with AI:', err);
    res.status(500).json({ error: 'Failed to analyze pizza flavor.' });
  }
});

// 3. AI Pizza Chef Luigi Chat Copilot
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const result = await aiChatLuigi(messages);
    res.json(result);
  } catch (err: any) {
    console.error('Error in Chef Luigi AI chat:', err);
    res.status(500).json({ error: 'Chef Luigi is busy at the oven. Please try again.' });
  }
});

// 4. AI Kitchen Insights (Admin & Kitchen operations)
router.get('/kitchen-insights', async (req, res) => {
  try {
    const result = await aiKitchenInsights();
    res.json(result);
  } catch (err: any) {
    console.error('Error fetching AI kitchen insights:', err);
    res.status(500).json({ error: 'Failed to generate kitchen insights.' });
  }
});

export default router;
