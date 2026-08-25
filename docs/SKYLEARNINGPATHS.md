# SkyLearningPaths — Wave 2 Slot #118

**Status:** engineering beta / education domain core.

SkyLearningPaths adds ordered multi-course learning paths to the existing SkySchool learning-progress repository. It supports bounded path registration, deterministic enrollment/progress, idempotent course completion, next-course selection, and explicit `credentialIssued: false` truth signaling.

## SKYCOIN4444 integration contract

SkySchool or another trusted education adapter should register path `courseIds` that correspond to courses available in its own catalog, then mirror verified course-completion events into `completeCourse`. This library does not independently prove that a learner completed a course; the caller owns that evidence.

## Security and product boundary

The core does not authenticate learners, persist records durably, issue certificates, verify credentials, provide grading/proctoring, enforce prerequisites outside ordered metadata, process payments, claim accreditation, establish FERPA/COPPA compliance, or prove production deployment.

Tests cover deterministic ordering, progress, completion truth signals, invalid transitions, and duplicate-course rejection.