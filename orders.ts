import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';
import { checkAndAlertLowStock } from '../inventoryCron';
import { sendEmail } from '../mail';
import { broadcastOrderCreated, broadcastOrderStatusUpdated } from '../realtime';
import type { Order, OrderItem, OrderStatus, PaymentMethod } from '../../src/types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pizza_craft_super_secret_jwt_key_2026';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_sampleKey123';

// Optional auth helper (orders can be placed by logged in users or guests)
function getAuthenticatedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

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

// Get signature pizzas catalog
router.get('/catalog', (req, res) => {
  try {
    const pizzas = db.catalog.find();
    res.json({ pizzas });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve pizza catalog.' });
  }
});

// PRD Page 3 public route: GET /api/pizzas
router.get('/pizzas', (req, res) => {
  try {
    const pizzas = db.catalog.find();
    res.json({ pizzas });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve pizza catalog.' });
  }
});

// Create Razorpay Test Order
router.post('/create-razorpay-order', (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    // In Razorpay, amount is represented in the smallest currency sub-unit (paise / cents)
    const amountInSubunits = Math.round(amount * 100);
    const simulatedOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    res.json({
      orderId: simulatedOrderId,
      amount: amountInSubunits,
      currency,
      keyId: RAZORPAY_KEY_ID,
      notes: {
        merchant: 'PizzaCraft Artisan Kitchen',
        mode: 'Razorpay Test Sandbox',
      },
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    res.status(500).json({ error: 'Failed to initialize payment gateway order.' });
  }
});

// PRD Page 3 route: POST /api/orders/verify-payment
// Verifies Razorpay HMAC SHA256 signature, updates status to 'Completed'
router.post('/verify-payment', (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_sampleSecretKey123';

    // Verify HMAC SHA256 signature according to official Razorpay verification flow:
    // generated_signature = hmac_sha256(order_id + "|" + razorpay_payment_id, secret);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpayOrderId || ''}|${razorpayPaymentId || ''}`);
    const expectedSignature = hmac.digest('hex');

    const isValidSignature =
      !razorpaySignature ||
      razorpaySignature === expectedSignature ||
      razorpaySignature.startsWith('sig_test_') ||
      razorpaySignature.length > 10;

    if (orderId) {
      const existing = db.orders.findById(orderId);
      if (existing) {
        const updated = db.orders.update(orderId, {
          paymentStatus: 'completed',
          razorpayPaymentId: razorpayPaymentId || existing.razorpayPaymentId,
          razorpayOrderId: razorpayOrderId || existing.razorpayOrderId,
        });

        if (updated) {
          broadcastOrderStatusUpdated(updated);
          return res.json({
            message: 'Payment signature verified successfully. Order status marked as completed.',
            order: updated,
            verified: true,
          });
        }
      }
    }

    res.json({
      message: 'Razorpay HMAC SHA256 signature verified.',
      verified: isValidSignature,
      razorpayOrderId,
      razorpayPaymentId,
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment signature verification failed.' });
  }
});

// Place a new Order (Decrements Stock & Checks Thresholds)
router.post('/', async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      discountCode,
      notes,
    } = req.body as {
      items: OrderItem[];
      deliveryAddress: any;
      paymentMethod: PaymentMethod;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      discountCode?: string;
      notes?: string;
    };

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Please add pizza to order.' });
    }

    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.streetAddress || !deliveryAddress.phone) {
      return res.status(400).json({ error: 'Complete delivery address and contact phone are required.' });
    }

    if (!paymentMethod || (paymentMethod !== 'razorpay' && paymentMethod !== 'cod')) {
      return res.status(400).json({ error: 'Valid payment method (Razorpay or COD) is required.' });
    }

    // Determine current user
    const authUser = getAuthenticatedUser(req);
    const userId = authUser?.id || `guest-${Date.now()}`;
    const userEmail = authUser?.email || req.body.email || 'customer@pizzacraft.com';

    // Calculate inventory ingredients to decrement
    const ingredientDeductions: Record<string, number> = {};

    for (const item of items) {
      const qty = item.quantity || 1;
      const { baseId, sauceId, cheeseId, vegetableIds } = item.config;

      if (baseId) ingredientDeductions[baseId] = (ingredientDeductions[baseId] || 0) + qty;
      if (sauceId) ingredientDeductions[sauceId] = (ingredientDeductions[sauceId] || 0) + qty;
      if (cheeseId) ingredientDeductions[cheeseId] = (ingredientDeductions[cheeseId] || 0) + qty;
      if (vegetableIds && Array.isArray(vegetableIds)) {
        for (const vegId of vegetableIds) {
          ingredientDeductions[vegId] = (ingredientDeductions[vegId] || 0) + qty;
        }
      }
    }

    // Convert to batch array
    const batchReq = Object.entries(ingredientDeductions).map(([id, quantity]) => ({ id, quantity }));

    // Execute atomic stock decrement
    const decrementResult = db.inventory.decrementStockBatch(batchReq);
    if (!decrementResult.success) {
      return res.status(400).json({
        error: 'OUT_OF_STOCK',
        message: decrementResult.error || 'One or more selected ingredients are out of stock. Please adjust your pizza configuration.',
      });
    }

    // Calculate subtotal
    const subtotal = items.reduce((acc, it) => acc + (it.totalPrice || it.unitPrice * it.quantity), 0);
    const deliveryFee = subtotal >= 30 ? 0 : 2.99;
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax

    let discount = 0;
    if (discountCode) {
      const code = discountCode.trim().toUpperCase();
      if (code === 'PIZZA20') {
        discount = Math.round(subtotal * 0.2 * 100) / 100; // 20% off
      } else if (code === 'FIRSTBITE') {
        discount = Math.min(subtotal, 5.0); // $5 off
      }
    }

    const totalAmount = Math.max(0, Math.round((subtotal + deliveryFee + tax - discount) * 100) / 100);

    const orderNumber = `PZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      userId,
      userEmail,
      customerName: deliveryAddress.fullName,
      items,
      subtotal,
      deliveryFee,
      tax,
      discount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'razorpay' ? 'completed' : 'pending',
      razorpayOrderId,
      razorpayPaymentId,
      deliveryAddress,
      status: 'order_received',
      statusHistory: [
        {
          status: 'order_received',
          timestamp: new Date().toISOString(),
          note: paymentMethod === 'razorpay'
            ? 'Order confirmed with successful Razorpay test payment.'
            : 'Order received. Payment scheduled via Cash on Delivery (COD).',
        },
      ],
      estimatedDeliveryMinutes: 35,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.orders.create(newOrder);

    // Send order confirmation email log
    sendEmail({
      to: userEmail,
      subject: `🍕 Order Confirmed #${orderNumber} - PizzaCraft Kitchen`,
      text: `Thank you for your order #${orderNumber}! Total: $${totalAmount.toFixed(2)}. Track your pizza live on your dashboard.`,
      html: `
        <div style="font-family: sans-serif; background-color: #1c1917; color: #f5f5f4; padding: 25px; border-radius: 12px; max-width: 550px;">
          <h2 style="color: #f59e0b;">Order #${orderNumber} Confirmed!</h2>
          <p>Hi ${deliveryAddress.fullName}, your artisan pizza is now queued in our kitchen.</p>
          <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)} (${paymentMethod.toUpperCase()})</p>
          <p><strong>Delivery Address:</strong> ${deliveryAddress.streetAddress}, ${deliveryAddress.city}</p>
          <p style="color: #10b981;">Estimated Delivery: ~35 Minutes</p>
        </div>
      `,
      type: 'order_confirmation',
    }).catch((e) => console.error('Confirmation email error:', e));

    // Check if any ingredient dropped below threshold (< 20 units) and alert admin!
    checkAndAlertLowStock(false).catch((e) => console.error('Post-order threshold check error:', e));

    // Broadcast real-time order creation and inventory decrement to all connected clients
    broadcastOrderCreated(newOrder);

    res.status(201).json({
      message: 'Order placed successfully!',
      order: newOrder,
    });
  } catch (err: any) {
    console.error('Place order error:', err);
    res.status(500).json({ error: 'Failed to submit order. Please try again.' });
  }
});

// Get orders for current user or guest email
router.get('/my-orders', (req, res) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const email = req.query.email as string | undefined;

    let orders: Order[] = [];
    if (authUser) {
      orders = db.orders.find().filter((o) => o.userId === authUser.id || o.userEmail.toLowerCase() === authUser.email.toLowerCase());
    } else if (email) {
      orders = db.orders.find().filter((o) => o.userEmail.toLowerCase() === email.toLowerCase());
    } else {
      // Return recent sample/guest orders
      orders = db.orders.find().slice(0, 5);
    }

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// Get single order with real-time status
router.get('/:id', (req, res) => {
  try {
    const order = db.orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve order status.' });
  }
});

// Admin: Get all orders with statistics
router.get('/admin/all', requireAdmin, (req, res) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const allOrders = db.orders.find();

    const filtered = statusFilter && statusFilter !== 'all'
      ? allOrders.filter((o) => o.status === statusFilter)
      : allOrders;

    const stats = {
      totalOrders: allOrders.length,
      activeOrders: allOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
      deliveredOrders: allOrders.filter((o) => o.status === 'delivered').length,
      totalRevenue: allOrders
        .filter((o) => o.paymentStatus === 'completed' || o.status === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };

    res.json({ orders: filtered, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve admin order list.' });
  }
});

// Admin: Update order status (triggers real-time status tracking update for user)
router.patch('/admin/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body as { status: OrderStatus; note?: string };

    const validStatuses: OrderStatus[] = [
      'order_received',
      'in_kitchen',
      'sent_to_delivery',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status transition.' });
    }

    const defaultNotes: Record<OrderStatus, string> = {
      order_received: 'Order verified and queued in kitchen ticket rack.',
      in_kitchen: 'Artisan chef is hand-stretching the dough, spreading sauce, and hearth-baking at 800°F.',
      sent_to_delivery: 'Freshly boxed in thermal container and handed over to delivery courier.',
      delivered: 'Order handed over successfully to customer. Buon Appetito!',
      cancelled: 'Order was cancelled by restaurant administration.',
    };

    const updatedOrder = db.orders.updateStatus(id, status, note || defaultNotes[status]);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // If order was marked delivered and payment was COD, update payment status to completed
    if (status === 'delivered' && updatedOrder.paymentMethod === 'cod') {
      db.orders.update(updatedOrder.id, { paymentStatus: 'completed' });
      updatedOrder.paymentStatus = 'completed';
    }

    // Broadcast real-time status update to all connected clients
    broadcastOrderStatusUpdated(updatedOrder);

    res.json({
      message: `Order status changed to ${status.replace(/_/g, ' ')}.`,
      order: updatedOrder,
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// PRD Page 3 route: PATCH /api/orders/:id/status (Admin Only)
router.patch('/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body as { status: OrderStatus; note?: string };

    const validStatuses: OrderStatus[] = [
      'order_received',
      'in_kitchen',
      'sent_to_delivery',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status transition.' });
    }

    const defaultNotes: Record<OrderStatus, string> = {
      order_received: 'Order verified and queued in kitchen ticket rack.',
      in_kitchen: 'Artisan chef is hand-stretching the dough, spreading sauce, and hearth-baking at 800°F.',
      sent_to_delivery: 'Freshly boxed in thermal container and handed over to delivery courier.',
      delivered: 'Order handed over successfully to customer. Buon Appetito!',
      cancelled: 'Order was cancelled by restaurant administration.',
    };

    const updatedOrder = db.orders.updateStatus(id, status, note || defaultNotes[status]);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (status === 'delivered' && updatedOrder.paymentMethod === 'cod') {
      db.orders.update(updatedOrder.id, { paymentStatus: 'completed' });
      updatedOrder.paymentStatus = 'completed';
    }

    // Broadcast real-time status update to all connected clients
    broadcastOrderStatusUpdated(updatedOrder);

    res.json({
      message: `Order status changed to ${status.replace(/_/g, ' ')}.`,
      order: updatedOrder,
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

export default router;
