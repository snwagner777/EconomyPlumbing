import { db } from "../db";
import { customersXlsx, contactsXlsx } from "../../shared/schema";
import { sql } from "drizzle-orm";

async function quickTest() {
  console.log("Quick test: Inserting test data directly...");
  
  try {
    // Insert a few test customers
    const testCustomers = [
      {
        id: 999001,
        name: "Test Customer 1",
        type: "Residential",
        email: "test1@example.com",
        phone: "555-1234",
        mobilePhone: "555-5678",
        street: "123 Main St",
        city: "Springfield",
        state: "IL",
        zip: "62701",
        active: true,
        balance: "0.00",
        jobCount: 5,
        lastServiceDate: new Date("2025-01-15"),
        lastServiceType: "HVAC Repair",
        lifetimeValue: 2500.00,
        customerTags: [],
        preferredContactMethod: "email",
        lastSyncedAt: new Date()
      },
      {
        id: 999002,
        name: "Test Customer 2",
        type: "Commercial",
        email: "test2@example.com",
        phone: "555-9999",
        mobilePhone: null,
        street: "456 Oak Ave",
        city: "Springfield",
        state: "IL",
        zip: "62702",
        active: true,
        balance: "150.00",
        jobCount: 0,
        lastServiceDate: null,
        lastServiceType: null,
        lifetimeValue: 0,
        customerTags: [],
        preferredContactMethod: "phone",
        lastSyncedAt: new Date()
      }
    ];

    for (const customer of testCustomers) {
      const tagsArray = sql.raw(`ARRAY[]::text[]`);
      
      await db.execute(sql`
        INSERT INTO customers_xlsx (
          id, name, type, email, phone, mobile_phone, street, city, state, zip,
          active, balance, job_count, last_service_date, last_service_type,
          lifetime_value, customer_tags, preferred_contact_method, last_synced_at
        ) VALUES (
          ${customer.id}, ${customer.name}, ${customer.type}, ${customer.email},
          ${customer.phone}, ${customer.mobilePhone}, ${customer.street}, ${customer.city},
          ${customer.state}, ${customer.zip}, ${customer.active}, ${customer.balance},
          ${customer.jobCount}, ${customer.lastServiceDate}, ${customer.lastServiceType},
          ${customer.lifetimeValue}, ${tagsArray}, ${customer.preferredContactMethod},
          ${customer.lastSyncedAt}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    }

    console.log("✅ Test customers inserted successfully");
    
    const count = await db.execute(sql`SELECT COUNT(*) as count FROM customers_xlsx`);
    console.log(`Total customers in database: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

quickTest().then(() => {
  console.log("Test complete");
  process.exit(0);
}).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
