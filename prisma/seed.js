const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  try {
    // 1. Create Admin/Manager User
    const managerEmail = "manager@example.com";
    const userRes = await client.query(`
      INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id;
    `, ['cm123456780manager000000', managerEmail, 'Manager Alice', 'MANAGER']);
    
    const managerId = userRes.rows[0].id;

    // 2. Create Hotel
    const hotelSlug = "grand-beach-resort";
    const hotelRes = await client.query(`
      INSERT INTO "Hotel" (id, name, slug, description, "managerId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
      RETURNING id;
    `, ['cm123456780hotel00000000', 'Grand Beach Resort', hotelSlug, 'Luxury relaxation by the sea.', managerId]);
    
    const hotelId = hotelRes.rows[0].id;

    // 3. Create Zone
    const zoneRes = await client.query(`
      INSERT INTO "Zone" (id, name, "hotelId", "imageUrl", width, height, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id;
    `, ['cm123456780zone000000000', 'VIP Poolside', hotelId, 'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80', 1000, 800]);

    const zoneId = zoneRes.rows[0].id;

    // 4. Create Sunbeds
    const sunbeds = [
        { label: "A1", x: 0.2, y: 0.2, angle: 0 },
        { label: "A2", x: 0.3, y: 0.2, angle: 0 },
        { label: "B1", x: 0.2, y: 0.4, angle: 45 },
        { label: "B2", x: 0.3, y: 0.4, angle: 45 },
    ];

    for (const bed of sunbeds) {
        await client.query(`
            INSERT INTO "Sunbed" (id, label, x, y, angle, scale, "zoneId", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, 1, $5, NOW(), NOW())
        `, [bed.label, bed.x, bed.y, bed.angle, zoneId]);
    }

    console.log("Seeding completed.");
  } catch (err) {
    console.error("Seeding failed", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
