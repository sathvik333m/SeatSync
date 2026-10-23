/**
 * Concurrency Test Scenario 1: Resource Booking Race Condition
 * Demonstrates PostgreSQL's btree_gist exclusion constraint in action:
 * Two users attempt to book the exact same study room for the exact same time window concurrently.
 */
const reservationService = require('../src/services/reservationService');
const db = require('../src/config/db');

async function testConcurrentBooking() {
  console.log('\n======================================================');
  console.log('🧪 Testing Scenario 1: Concurrent Overlapping Booking Conflict');
  console.log('Two users simultaneously attempting to reserve Room 1 for the exact same slot');
  console.log('======================================================\n');

  // Set booking window: 10 days in the future to avoid seed conflicts
  const start = new Date(Date.now() + 10 * 24 * 3600 * 1000);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(12, 0, 0, 0);

  const resourceId = 1; // Turing Lab Room 101
  const userA = 1; // Alex Chen
  const userB = 2; // Priya Sharma

  console.log(`Resource: Room 1 (Turing Lab)`);
  console.log(`Slot: ${start.toISOString()} -> ${end.toISOString()}`);
  console.log(`Initiating 2 simultaneous booking transactions in parallel...\n`);

  const results = await Promise.allSettled([
    reservationService.createReservation({
      userId: userA,
      resourceId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      purpose: 'User A Booking attempt',
    }),
    reservationService.createReservation({
      userId: userB,
      resourceId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      purpose: 'User B Booking attempt',
    }),
  ]);

  results.forEach((res, index) => {
    const userLabel = index === 0 ? 'User A (Alex)' : 'User B (Priya)';
    if (res.status === 'fulfilled') {
      console.log(`✅ ${userLabel}: Booking SUCCEEDED! Reservation ID #${res.value.reservation_id}`);
    } else {
      console.log(`🛡️ ${userLabel}: Booking SAFELY REJECTED by PostgreSQL!`);
      console.log(`   Error Code: ${res.reason.code || 'APP_ERROR'}`);
      console.log(`   DBMS Reason: ${res.reason.message}`);
    }
  });

  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  const failureCount = results.filter((r) => r.status === 'rejected').length;

  console.log(`\n📌 Result: ${successCount} Succeeded, ${failureCount} Rejected.`);
  if (successCount === 1 && failureCount === 1) {
    console.log('🎉 PASS: Database exclusion constraint guaranteed zero overlapping reservations!');
  } else {
    console.log('⚠️ Unexpected result. Check database state.');
  }

  await db.pool.end();
  process.exit(0);
}

testConcurrentBooking().catch((err) => {
  console.error('Fatal error in concurrency test:', err);
  process.exit(1);
});
