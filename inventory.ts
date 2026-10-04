import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { checkAndAlertLowStock } from '../inventoryCron';
import { broadcastInventoryChanged } from '../realtime';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pizza_craft_super_secret_jwt_key_2026';

// Middleware to verify admin privileges
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Get all inventory items (public or authenticated)
router.get('/', (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const items = db.inventory.find(category);

    // Grouping convenience for the pizza builder
    const grouped = {
      bases: items.filter((i) => i.category === 'bases'),
      sauces: items.filter((i) => i.category === 'sauces'),
      cheeses: items.filter((i) => i.category === 'cheeses'),
      vegetables: items.filter((i) => i.category === 'vegetables'),
    };

    const lowStockCount = items.filter((i) => i.stock < i.threshold).length;

    res.json({
      items,
      grouped,
      lowStockCount,
    });
  } catch (err) {
    console.error('Fetch inventory error:', err);
    res.status(500).json({ error: 'Failed to retrieve inventory items.' });
  }
});

// Get only items currently below threshold
router.get('/low-stock', (req, res) => {
  try {
    const all = db.inventory.find();
    const low = all.filter((i) => i.stock < i.threshold);
    res.json({ lowStockItems: low, count: low.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve low stock items.' });
  }
});

// Update an inventory item (Stock, Threshold, Price, Unit) - Admin Only
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { stock, threshold, price, name } = req.body;

    const existing = db.inventory.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    const updates: any = {};
    if (typeof stock === 'number') updates.stock = Math.max(0, stock);
    if (typeof threshold === 'number') updates.threshold = Math.max(0, threshold);
    if (typeof price === 'number') updates.price = Math.max(0, price);
    if (name) updates.name = name;

    const updated = db.inventory.update(id, updates);

    // Broadcast inventory changes immediately in real-time
    broadcastInventoryChanged();

    // Automatically check if stock fell below threshold or changed
    checkAndAlertLowStock(false).catch((e) => console.error('Stock check error:', e));

    res.json({
      message: 'Inventory updated successfully.',
      item: updated,
    });
  } catch (err) {
    console.error('Update inventory error:', err);
    res.status(500).json({ error: 'Failed to update inventory item.' });
  }
});

// Manually trigger stock threshold check and email dispatch - Admin Only
router.post('/check-thresholds', requireAdmin, async (req, res) => {
  try {
    const result = await checkAndAlertLowStock(true);
    res.json({
      message: result.alerted
        ? `Alert triggered! ${result.lowCount} items are below threshold. Email dispatched to admin.`
        : `Inventory health verified. ${result.lowCount} items below threshold.`,
      ...result,
    });
  } catch (err) {
    console.error('Trigger threshold check error:', err);
    res.status(500).json({ error: 'Failed to perform inventory threshold check.' });
  }
});

export default router;
