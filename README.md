# SkySchool Core

SkySchool Core is a dependency-free Node.js domain library for bounded course registration, learner enrollment, lesson completion, and deterministic progress calculation.

## Status

**Engineering beta.** This repository implements a reusable learning-progress core. It does **not** claim to be a complete LMS, hosted school, student-information system, credential authority, payment platform, or production deployment.

## Supported behavior

- register courses with 1–200 unique lesson IDs;
- bound the process-local catalog to 500 courses;
- enroll learners idempotently;
- complete only lessons that belong to an enrolled course;
- calculate completed lesson count, percentage, and course-complete state deterministically;
- explicitly report `certificateIssued: false` because certificate issuance is outside this core.

## Example

```js
import { SkySchoolCore } from '@skycoin4444/skyschool-core';

const school = new SkySchoolCore();
school.registerCourse({
  id: 'js-101',
  title: 'JavaScript Basics',
  lessonIds: ['intro', 'values']
});

school.enroll({ learnerId: 'learner-1', courseId: 'js-101' });
const progress = school.completeLesson({
  learnerId: 'learner-1',
  courseId: 'js-101',
  lessonId: 'intro'
});

console.log(progress.percentComplete); // 50
```

## Verification

Requires Node.js 22 or newer.

```bash
npm ci
npm run check
npm test
npm audit --omit=dev --audit-level=high
npm run pack:check
```

GitHub Actions runs the same gates on pushes and pull requests.

## Architecture and integration

`src/index.js` owns the domain invariants and has no network, database, or framework dependency. SKYCOIN4444 can consume it through a service adapter without copying the implementation. Persistence, authentication, authorization, classroom UI, assessments, grades, payments, messaging, analytics, and credential issuance belong in surrounding components with separately verified contracts.

## Security and privacy boundary

The library stores process-local learner/course identifiers only while the owning process is alive. It does not provide authentication, authorization, tenant isolation, encryption at rest, durable audit logging, FERPA/COPPA compliance controls, or privacy-policy enforcement. Do not treat arbitrary caller identifiers as verified identities.

See `SECURITY.md` for vulnerability reporting guidance.

## License

MIT. See `LICENSE`.
