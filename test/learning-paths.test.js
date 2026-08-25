import test from 'node:test';
import assert from 'node:assert/strict';
import { SkyLearningPaths } from '../src/learning-paths.js';

test('tracks ordered learning path progress deterministically', () => {
  const paths = new SkyLearningPaths();
  paths.registerPath({ id: 'web3-track', title: 'Web3 Foundations', courseIds: ['intro', 'wallets', 'security'] });
  let progress = paths.enroll({ learnerId: 'learner-1', pathId: 'web3-track' });
  assert.equal(progress.percentComplete, 0);
  assert.equal(paths.nextCourse({ learnerId: 'learner-1', pathId: 'web3-track' }), 'intro');
  progress = paths.completeCourse({ learnerId: 'learner-1', pathId: 'web3-track', courseId: 'intro' });
  assert.deepEqual(progress.completedCourseIds, ['intro']);
  assert.deepEqual(progress.remainingCourseIds, ['wallets', 'security']);
  assert.equal(progress.credentialIssued, false);
});

test('reserves 100 percent for complete paths and rejects unsafe transitions', () => {
  const paths = new SkyLearningPaths();
  paths.registerPath({ id: 'p', title: 'Path', courseIds: ['c1', 'c2'] });
  paths.enroll({ learnerId: 'l', pathId: 'p' });
  let progress = paths.completeCourse({ learnerId: 'l', pathId: 'p', courseId: 'c1' });
  assert.equal(progress.percentComplete, 50);
  assert.equal(progress.pathComplete, false);
  progress = paths.completeCourse({ learnerId: 'l', pathId: 'p', courseId: 'c2' });
  assert.equal(progress.percentComplete, 100);
  assert.equal(progress.pathComplete, true);
  assert.equal(paths.nextCourse({ learnerId: 'l', pathId: 'p' }), null);
  assert.throws(() => paths.completeCourse({ learnerId: 'other', pathId: 'p', courseId: 'c1' }), /not enrolled/);
});

test('rejects duplicate path course identifiers', () => {
  const paths = new SkyLearningPaths();
  assert.throws(() => paths.registerPath({ id: 'dup', title: 'Duplicate', courseIds: ['c1', 'c1'] }), /unique/);
});
