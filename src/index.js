const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const MAX_COURSES = 500;
const MAX_LESSONS = 200;
const MAX_TITLE_LENGTH = 160;

function requireId(value, field) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new TypeError(`${field} must be 1-64 letters, numbers, underscores, or hyphens`);
  }
  return value;
}

function requireTitle(value) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > MAX_TITLE_LENGTH) {
    throw new TypeError(`title must be 1-${MAX_TITLE_LENGTH} characters`);
  }
  return value.trim();
}

export class SkySchoolCore {
  #courses = new Map();
  #enrollments = new Map();

  registerCourse({ id, title, lessonIds }) {
    const courseId = requireId(id, 'course id');
    if (this.#courses.has(courseId)) throw new Error('course already exists');
    if (this.#courses.size >= MAX_COURSES) throw new Error('course capacity reached');
    if (!Array.isArray(lessonIds) || lessonIds.length === 0 || lessonIds.length > MAX_LESSONS) {
      throw new TypeError(`lessonIds must contain 1-${MAX_LESSONS} lessons`);
    }
    const normalizedLessons = lessonIds.map((lessonId) => requireId(lessonId, 'lesson id'));
    if (new Set(normalizedLessons).size !== normalizedLessons.length) throw new Error('lesson ids must be unique');

    const course = Object.freeze({ id: courseId, title: requireTitle(title), lessonIds: Object.freeze([...normalizedLessons]) });
    this.#courses.set(courseId, course);
    return course;
  }

  listCourses() {
    return [...this.#courses.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  enroll({ learnerId, courseId }) {
    const learner = requireId(learnerId, 'learner id');
    const course = this.#courses.get(requireId(courseId, 'course id'));
    if (!course) throw new Error('course not found');
    const key = `${learner}:${course.id}`;
    if (!this.#enrollments.has(key)) {
      this.#enrollments.set(key, { learnerId: learner, courseId: course.id, completed: new Set() });
    }
    return this.getProgress({ learnerId: learner, courseId: course.id });
  }

  completeLesson({ learnerId, courseId, lessonId }) {
    const learner = requireId(learnerId, 'learner id');
    const course = this.#courses.get(requireId(courseId, 'course id'));
    if (!course) throw new Error('course not found');
    const lesson = requireId(lessonId, 'lesson id');
    if (!course.lessonIds.includes(lesson)) throw new Error('lesson not found in course');
    const key = `${learner}:${course.id}`;
    const enrollment = this.#enrollments.get(key);
    if (!enrollment) throw new Error('learner is not enrolled');
    enrollment.completed.add(lesson);
    return this.getProgress({ learnerId: learner, courseId: course.id });
  }

  getProgress({ learnerId, courseId }) {
    const learner = requireId(learnerId, 'learner id');
    const course = this.#courses.get(requireId(courseId, 'course id'));
    if (!course) throw new Error('course not found');
    const enrollment = this.#enrollments.get(`${learner}:${course.id}`);
    if (!enrollment) throw new Error('learner is not enrolled');
    const completedLessons = course.lessonIds.filter((id) => enrollment.completed.has(id));
    return Object.freeze({
      learnerId: learner,
      courseId: course.id,
      completedLessons: Object.freeze(completedLessons),
      completedCount: completedLessons.length,
      totalLessons: course.lessonIds.length,
      percentComplete: Math.round((completedLessons.length / course.lessonIds.length) * 100),
      courseComplete: completedLessons.length === course.lessonIds.length,
      certificateIssued: false
    });
  }
}

export const limits = Object.freeze({ maxCourses: MAX_COURSES, maxLessonsPerCourse: MAX_LESSONS });
