const { query, getClient } = require('../config/database');

class FIFOService {

  async processPurchase(productId, quantity, unitPrice, timestamp) {
    try {
      await this.ensureProductExists(productId);

      const result = await query(
        `INSERT INTO inventory_batches (product_id, quantity, original_quantity, unit_price, purchase_timestamp)
         VALUES ($1, $2, $2, $3, $4) RETURNING *`,
        [productId, quantity, unitPrice, timestamp]
      );

      console.log(` Purchase processed: ${quantity} units of ${productId} at $${unitPrice}/unit`);
      return result.rows[0];
    } catch (error) {
      console.error(' Error processing purchase:', error);
      throw error;
    }
  }

  async processSale(productId, quantityToSell, timestamp) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const availableResult = await client.query(
        `SELECT COALESCE(SUM(quantity), 0) as total_quantity 
         FROM inventory_batches 
         WHERE product_id = $1 AND quantity > 0`,
        [productId]
      );

      const availableQuantity = parseInt(availableResult.rows[0].total_quantity);
      if (availableQuantity < quantityToSell) {
        throw new Error(`Insufficient inventory. Available: ${availableQuantity}, Requested: ${quantityToSell}`);
      }

      const batchesResult = await client.query(
        `SELECT id, quantity, unit_price, purchase_timestamp
         FROM inventory_batches 
         WHERE product_id = $1 AND quantity > 0 
         ORDER BY purchase_timestamp ASC, id ASC
         FOR UPDATE`,
        [productId]
      );

      const batches = batchesResult.rows;
      let remainingToSell = quantityToSell;
      let totalCost = 0;
      const usedBatches = [];

      for (const batch of batches) {
        if (remainingToSell <= 0) break;

        const quantityFromThisBatch = Math.min(remainingToSell, batch.quantity);
        const costFromThisBatch = quantityFromThisBatch * parseFloat(batch.unit_price);

        await client.query(
          `UPDATE inventory_batches 
           SET quantity = quantity - $1 
           WHERE id = $2`,
          [quantityFromThisBatch, batch.id]
        );

        usedBatches.push({
          batch_id: batch.id,
          quantity_used: quantityFromThisBatch,
          unit_price: parseFloat(batch.unit_price),
          cost: costFromThisBatch
        });

        totalCost += costFromThisBatch;
        remainingToSell -= quantityFromThisBatch;
      }

      const averageUnitCost = totalCost / quantityToSell;

      const saleResult = await client.query(
        `INSERT INTO sales (product_id, quantity, total_cost, average_unit_cost, sale_timestamp)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [productId, quantityToSell, totalCost, averageUnitCost, timestamp]
      );

      const sale = saleResult.rows[0];

      for (const usedBatch of usedBatches) {
        await client.query(
          `INSERT INTO sale_batch_details (sale_id, batch_id, quantity_used, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [sale.id, usedBatch.batch_id, usedBatch.quantity_used, usedBatch.unit_price]
        );
      }

      await client.query('COMMIT');

      console.log(` Sale processed: ${quantityToSell} units of ${productId} for $${totalCost.toFixed(2)} (avg: $${averageUnitCost.toFixed(2)}/unit)`);
      return { sale, usedBatches, totalCost, averageUnitCost };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(' Error processing sale:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getInventoryStatus(productId) {
    try {
      const result = await query(
        `SELECT 
           p.id as product_id,
           p.name as product_name,
           COALESCE(SUM(ib.quantity), 0) as current_quantity,
           COALESCE(SUM(ib.quantity * ib.unit_price), 0) as total_inventory_value,
           CASE WHEN SUM(ib.quantity) > 0 
             THEN SUM(ib.quantity * ib.unit_price) / SUM(ib.quantity)
             ELSE 0
           END as weighted_average_cost
         FROM products p
         LEFT JOIN inventory_batches ib ON p.id = ib.product_id AND ib.quantity > 0
         WHERE p.id = $1
         GROUP BY p.id, p.name`,
        [productId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(' Error getting inventory status:', error);
      throw error;
    }
  }

  async getAllInventoryStatus() {
    try {
      const result = await query(
        `SELECT 
           p.id as product_id,
           p.name as product_name,
           p.description,
           COALESCE(SUM(ib.quantity), 0) as current_quantity,
           COALESCE(SUM(ib.quantity * ib.unit_price), 0) as total_inventory_value,
           CASE WHEN SUM(ib.quantity) > 0 
             THEN SUM(ib.quantity * ib.unit_price) / SUM(ib.quantity)
             ELSE 0
           END as weighted_average_cost
         FROM products p
         LEFT JOIN inventory_batches ib ON p.id = ib.product_id AND ib.quantity > 0
         GROUP BY p.id, p.name, p.description
         ORDER BY p.id`
      );
      return result.rows;
    } catch (error) {
      console.error(' Error getting all inventory status:', error);
      throw error;
    }
  }

  async ensureProductExists(productId) {
    try {
      const result = await query(
        `INSERT INTO products (id, name, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (id) DO NOTHING
         RETURNING *`,
        [productId, `Product ${productId}`, `Auto-generated product ${productId}`]
      );

      if (result.rows.length > 0) {
        console.log(` Created new product: ${productId}`);
      }
    } catch (error) {
      console.error(' Error ensuring product exists:', error);
      throw error;
    }
  }

  async getProductBatches(productId) {
    try {
      const result = await query(
        `SELECT id, quantity, original_quantity, unit_price, purchase_timestamp, created_at
         FROM inventory_batches
         WHERE product_id = $1 AND quantity > 0
         ORDER BY purchase_timestamp ASC, id ASC`,
        [productId]
      );
      return result.rows;
    } catch (error) {
      console.error(' Error getting product batches:', error);
      throw error;
    }
  }

  async getSalesByProduct(productId) {
    try {
      const result = await query(
        `SELECT 
           s.id as sale_id,
           s.product_id,
           p.name as product_name,
           s.quantity,
           s.total_cost,
           s.average_unit_cost,
           s.sale_timestamp,
           s.created_at,
           json_agg(json_build_object(
             'batch_id', sbd.batch_id,
             'quantity_used', sbd.quantity_used,
             'unit_price', sbd.unit_price
           )) as batch_details
         FROM sales s
         JOIN products p ON s.product_id = p.id
         LEFT JOIN sale_batch_details sbd ON s.id = sbd.sale_id
         WHERE s.product_id = $1
         GROUP BY s.id, s.product_id, p.name, s.quantity, s.total_cost, s.average_unit_cost, s.sale_timestamp, s.created_at
         ORDER BY s.sale_timestamp DESC`,
        [productId]
      );
      return result.rows;
    } catch (error) {
      console.error(' Error getting sales by product:', error);
      throw error;
    }
  }

  async getTransactionHistory(limit = 50, offset = 0) {
    try {
      const result = await query(
        `(
          SELECT 
            'purchase' as transaction_type,
            p.name as product_name,
            ib.product_id,
            ib.original_quantity as quantity,
            ib.unit_price,
            ib.original_quantity * ib.unit_price as total_amount,
            ib.purchase_timestamp as transaction_timestamp,
            ib.created_at
          FROM inventory_batches ib
          JOIN products p ON ib.product_id = p.id
        )
        UNION ALL
        (
          SELECT 
            'sale' as transaction_type,
            p.name as product_name,
            s.product_id,
            s.quantity,
            s.average_unit_cost as unit_price,
            s.total_cost as total_amount,
            s.sale_timestamp as transaction_timestamp,
            s.created_at
          FROM sales s
          JOIN products p ON s.product_id = p.id
        )
        ORDER BY transaction_timestamp DESC, created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error(' Error getting transaction history:', error);
      throw error;
    }
  }
}

module.exports = new FIFOService();
