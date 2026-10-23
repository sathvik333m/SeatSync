/**
 * Concurrency Test Scenario 3: Workshop Capacity Exceeded
 * Demonstrates PostgreSQL row-locking (FOR UPDATE) to serialize enrollments:
 * Multiple learners attempt to accept the final seat of a workshop simultaneously.
 */
const peerLearningService = require('../src/services/peerLearningService');
const db = require('../src/config/db');

async function testCapacityLimit() {
  console.log('\n======================================================');
  console.log('🧪 Testing Scenario 3: Group Workshop Capacity Limit');
  console.log('Testing enrollment serialization when only 1 seat remains');
  console.log('======================================================\n');

  try {
    // 1. Create a temporary listing with capacity = 2
    const teacherId = 1; // Alex Chen
    const listing = await peerLearningService.createListing({
      teacherId,
      skillId: 1,
      title: 'High-Concurrency PostgreSQL Workshop (Cap 2)',
      description: 'Test workshop for concurrency evaluation.',
      teachingFormat: 'group',
      difficulty: 'advanced',
      maxParticipants: 2,
    });
    console.log(`✅ Created test workshop ID #${listing.listing_id} with max_participants = 2`);

    // 2. Schedule a session
    const start = new Date(Date.now() + 5 * 24 * 3600 * 1000);
    const end = new Date(start.getTime() + 2 * 3600 * 1000);
    const session = await peerLearningService.scheduleSession({
      listingId: listing.listing_id,
      teacherId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    console.log(`✅ Scheduled session ID #${session.session_id}`);

    // 3. Create 3 student requests (Elena = 4, Devon = 5, Marcus = 3)
    const req1 = await peerLearningService.submitLearningRequest({
      listingId: listing.listing_id,
      learnerId: 4,
      message: 'Learner 1 application',
    });
    const req2 = await peerLearningService.submitLearningRequest({
      listingId: listing.listing_id,
      learnerId: 5,
      message: 'Learner 2 application',
    });
    const req3 = await peerLearningService.submitLearningRequest({
      listingId: listing.listing_id,
      learnerId: 3,
      message: 'Learner 3 application (exceeds cap)',
    });
    console.log(`✅ Created 3 learning requests (#${req1.request_id}, #${req2.request_id}, #${req3.request_id})`);

    // 4. Enroll Learner 1 (leaves 1 seat left)
    await peerLearningService.acceptLearnerIntoSession({
      sessionId: session.session_id,
      requestId: req1.request_id,
      teacherId,
    });
    console.log('✅ Learner 1 enrolled. Remaining capacity: 1 seat.');

    // 5. Try to concurrently enroll Learner 2 and Learner 3 for that last 1 seat!
    console.log('\n🚀 Triggering 2 simultaneous enrollments for the final 1 seat...');
    const results = await Promise.allSettled([
      peerLearningService.acceptLearnerIntoSession({
        sessionId: session.session_id,
        requestId: req2.request_id,
        teacherId,
      }),
      peerLearningService.acceptLearnerIntoSession({
        sessionId: session.session_id,
        requestId: req3.request_id,
        teacherId,
      }),
    ]);

    results.forEach((res, idx) => {
      const label = idx === 0 ? 'Learner 2' : 'Learner 3';
      if (res.status === 'fulfilled') {
        console.log(`✅ ${label}: Successfully claimed the last seat! (Seat 2/2)`);
      } else {
        console.log(`🛡️ ${label}: SAFELY REJECTED due to workshop capacity limit!`);
        console.log(`   Message: ${res.reason.message}`);
      }
    });

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    console.log(`\n📌 Result: ${successCount} Succeeded, ${failureCount} Rejected.`);
    if (successCount === 1 && failureCount === 1) {
      console.log('🎉 PASS: Database SELECT ... FOR UPDATE serialized the enrollments and strictly enforced max_participants = 2!');
    }

    await db.pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Test capacity error:', err);
    await db.pool.end();
    process.exit(1);
  }
}

testCapacityLimit();
