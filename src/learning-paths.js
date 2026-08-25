const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const MAX_PATHS = 500;
const MAX_STEPS = 100;
const MAX_TITLE = 160;

function requireId(value, label) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new TypeError(`${label} must be 1-64 letters, numbers, underscores, or hyphens`);
  }
  return value;
}

function requireTitle(value) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > MAX_TITLE) {
    throw new TypeError(`title must be 1-${MAX_TITLE} characters`);
  }
  return value.trim();
}

export class SkyLearningPaths {
  #paths = new Map();
  #progress = new Map();

  registerPath({ id, title, courseIds }) {
    const pathId = requireId(id, 'path id');
    if (this.#paths.has(pathId)) throw new Error('learning path already exists');
    if (this.#paths.size >= MAX_PATHS) throw new Error('learning path capacity reached');
    if (!Array.isArray(courseIds) || courseIds.length === 0 || courseIds.length > MAX_STEPS) {
      throw new TypeError(`courseIds must contain 1-${MAX_STEPS} courses`);
    }
    const normalized = courseIds.map((courseId) => requireId(courseId, 'course id'));
    if (new Set(normalized).size !== normalized.length) throw new Error('course ids must be unique');
    const path = Object.freeze({ id: pathId, title: requireTitle(title), courseIds: Object.freeze([...normalized]) });
    this.#paths.set(pathId, path);
    return path;
  }

  enroll({ learnerId, pathId }) {
    const learner = requireId(learnerId, 'learner id');
    const path = this.#requirePath(pathId);
    const key = `${learner}:${path.id}`;
    if (!this.#progress.has(key)) this.#progress.set(key, new Set());
    return this.getProgress({ learnerId: learner, pathId: path.id });
  }

  completeCourse({ learnerId, pathId, courseId }) {
    const learner = requireId(learnerId, 'learner id');
    const path = this.#requirePath(pathId);
    const course = requireId(courseId, 'course id');
    if (!path.courseIds.includes(course)) throw new Error('course not found in learning path');
    const key = `${learner}:${path.id}`;
    const completed = this.#progress.get(key);
    if (!completed) throw new Error('learner is not enrolled in learning path');
    completed.add(course);
    return this.getProgress({ learnerId: learner, pathId: path.id });
  }

  nextCourse({ learnerId, pathId }) {
    const progress = this.getProgress({ learnerId, pathId });
    return progress.remainingCourseIds[0] ?? null;
  }

  getProgress({ learnerId, pathId }) {
    const learner = requireId(learnerId, 'learner id');
    const path = this.#requirePath(pathId);
    const completed = this.#progress.get(`${learner}:${path.id}`);
    if (!completed) throw new Error('learner is not enrolled in learning path');
    const completedCourseIds = path.courseIds.filter((id) => completed.has(id));
    const remainingCourseIds = path.courseIds.filter((id) => !completed.has(id));
    const pathComplete = remainingCourseIds.length === 0;
    const rounded = Math.round((completedCourseIds.length / path.courseIds.length) * 100);
    return Object.freeze({
      learnerId: learner,
      pathId: path.id,
      completedCourseIds: Object.freeze(completedCourseIds),
      remainingCourseIds: Object.freeze(remainingCourseIds),
      percentComplete: pathComplete ? 100 : Math.min(99, rounded),
      pathComplete,
      credentialIssued: false
    });
  }

  listPaths() {
    return [...this.#paths.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  #requirePath(pathId) {
    const id = requireId(pathId, 'path id');
    const path = this.#paths.get(id);
    if (!path) throw new Error('learning path not found');
    return path;
  }
}

export const learningPathLimits = Object.freeze({ maxPaths: MAX_PATHS, maxCoursesPerPath: MAX_STEPS });
