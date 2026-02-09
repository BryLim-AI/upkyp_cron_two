import db from "../../db";

/**
 * Apply late fees to overdue billings.
 * Safe to run multiple times per day (idempotent).
 */
export async function applyLateFees(): Promise<{
  processed: number;
  penaltiesApplied: number;
}> {
  const connection = await db.getConnection();

  let processed = 0;
  let penaltiesApplied = 0;

  try {
    await connection.beginTransaction();

    /**
     * 1. Fetch all overdue & unpaid bills past grace period
     */
    const [bills]: any[] = await connection.query(`
      SELECT
        b.billing_id,
        b.total_amount_due,
        b.due_date,
        b.billing_period,
        DATEDIFF(CURDATE(), b.due_date) AS days_late,

        pc.gracePeriodDays,
        pc.lateFeeType,
        pc.lateFeeAmount,
        pc.lateFeeFrequency,

        la.rent_amount
      FROM Billing b
      JOIN LeaseAgreement la ON la.agreement_id = b.lease_id
      JOIN Unit u ON u.unit_id = b.unit_id
      JOIN Property p ON p.property_id = u.property_id
      JOIN PropertyConfiguration pc ON pc.property_id = p.property_id
      WHERE
        b.status IN ('unpaid', 'overdue')
        AND b.paid_at IS NULL
        AND CURDATE() > DATE_ADD(b.due_date, INTERVAL pc.gracePeriodDays DAY)
        AND pc.lateFeeAmount > 0
    `);

    /**
     * 2. Process each billing
     */
    for (const bill of bills) {
      processed++;

      const today = new Date().toISOString().slice(0, 10);
      const chargeType = `Late Fee (${today})`;

      /**
       * Idempotency check (per billing per day)
       */
      const [existing]: any[] = await connection.query(
        `
        SELECT 1
        FROM BillingAdditionalCharge
        WHERE billing_id = ?
          AND charge_type = ?
        `,
        [bill.billing_id, chargeType]
      );

      if (existing.length > 0) {
        continue;
      }

      /**
       * Calculate base penalty
       */
      let penalty = 0;

      if (bill.lateFeeType === "fixed") {
        penalty = bill.lateFeeAmount;
      } else if (bill.lateFeeType === "percentage") {
        penalty = bill.rent_amount * (bill.lateFeeAmount / 100);
      }

      /**
       * Apply frequency rules
       */
      if (bill.lateFeeFrequency === "per_day") {
        const effectiveLateDays = Math.max(
          bill.days_late - bill.gracePeriodDays,
          1
        );
        penalty = penalty * effectiveLateDays;
      }

      if (penalty <= 0) continue;

      /**
       * Insert late fee charge
       */
      await connection.query(
        `
        INSERT INTO BillingAdditionalCharge
          (billing_id, charge_category, charge_type, amount)
        VALUES
          (?, 'additional', ?, ?)
        `,
        [bill.billing_id, chargeType, penalty]
      );

      /**
       * Update billing totals & status
       */
      await connection.query(
        `
        UPDATE Billing
        SET
          total_amount_due = total_amount_due + ?,
          status = 'overdue',
          updated_at = CURRENT_TIMESTAMP
        WHERE billing_id = ?
        `,
        [penalty, bill.billing_id]
      );

      penaltiesApplied++;
    }

    await connection.commit();

    return {
      processed,
      penaltiesApplied,
    };
  } catch (error) {
    await connection.rollback();
    console.error("❌ Failed to apply late fees:", error);
    throw error;
  } finally {
    connection.release();
  }
}
