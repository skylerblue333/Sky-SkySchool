import test from 'node:test';
import assert from 'node:assert/strict';
import { SkySchoolCore } from '../src/index.js';

test('registers courses and tracks deterministic progress', () => {
  const school = new SkySchoolCore();
  school.registerCourse({ id: 'js-101', title: 'JavaScript Basics', lessonIds: ['intro', 'values'] });
  assert.deepEqual(school.listCourses().map((course) => course.id), ['js-101']);

  assert.equal(school.enroll({ learnerId: 'learner-1', courseId: 'js-101' }).percentComplete, 0);
  let progress = school.completeLesson({ learnerId: 'learner-1', courseId: 'js-101', lessonId: 'intro' });
  assert.equal(progress.percentComplete, 50);
  assert.equal(progress.courseComplete, false);
  assert.equal(progress.certificateIssued, false);

  progress = school.completeLesson({ learnerId: 'learner-1', courseId: 'js-101', lessonId: 'intro' });
  assert.equal(progress.completedCount, 1, 'completion must be idempotent');

  progress = school.completeLesson({ learnerId: 'learner-1', courseId: 'js-101', lessonId: 'values' });
  assert.equal(progress.percentComplete, 100);
  assert.equal(progress.courseComplete, true);
  assert.equal(progress.certificateIssued, false);
});

test('reserves 100 percent for actually completed courses', () => {
  const school = new SkySchoolCore();
  const lessonIds = Array.from({ length: 200 }, (_, index) => `lesson-${index + 1}`);
  school.registerCourse({ id: 'large-course', title: 'Large Course', lessonIds });
  school.enroll({ learnerId: 'learner-1', courseId: 'large-course' });

  let progress;
  for (const lessonId of lessonIds.slice(0, -1)) {
    progress = school.completeLesson({ learnerId: 'learner-1', courseId: 'large-course', lessonId });
  }
  assert.equal(progress.completedCount, 199);
  assert.equal(progress.percentComplete, 99);
  assert.equal(progress.courseComplete, false);

  progress = school.completeLesson({ learnerId: 'learner-1', courseId: 'large-course', lessonId: lessonIds.at(-1) });
  assert.equal(progress.percentComplete, 100);
  assert.equal(progress.courseComplete, true);
});

test('rejects duplicate courses and lesson identifiers', () => {
  const school = new SkySchoolCore();
  assert.throws(() => school.registerCourse({ id: 'bad', title: 'Bad', lessonIds: ['x', 'x'] }), /unique/);
  school.registerCourse({ id: 'good', title: 'Good', lessonIds: ['x'] });
  assert.throws(() => school.registerCourse({ id: 'good', title: 'Duplicate', lessonIds: ['y'] }), /already exists/);
});

test('requires enrollment and course membership before completion', () => {
  const school = new SkySchoolCore();
  school.registerCourse({ id: 'course', title: 'Course', lessonIds: ['lesson'] });
  assert.throws(() => school.completeLesson({ learnerId: 'l1', courseId: 'course', lessonId: 'lesson' }), /not enrolled/);
  school.enroll({ learnerId: 'l1', courseId: 'course' });
  assert.throws(() => school.completeLesson({ learnerId: 'l1', courseId: 'course', lessonId: 'other' }), /not found/);
});

test('validates identifiers, titles, and lesson bounds', () => {
  const school = new SkySchoolCore();
  assert.throws(() => school.registerCourse({ id: '../bad', title: 'Bad', lessonIds: ['lesson'] }), /course id/);
  assert.throws(() => school.registerCourse({ id: 'bad-title', title: ' ', lessonIds: ['lesson'] }), /title/);
  assert.throws(() => school.registerCourse({ id: 'empty', title: 'Empty', lessonIds: [] }), /lessonIds/);
});
