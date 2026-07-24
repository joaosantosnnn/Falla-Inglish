import { Course } from '../types';

const STORAGE_KEY = 'falla_course_availability_cache';

type AvailabilityCache = Record<string, boolean>;

export function isCourseEnabled(course: Course): boolean {
  return course.active !== false;
}

export function filterEnabledCourses(courses: Course[]): Course[] {
  return courses.filter(isCourseEnabled);
}

export function saveCourseAvailabilityCache(courses: Course[]): void {
  try {
    const cache: AvailabilityCache = {};
    courses.forEach(course => {
      cache[course.id] = isCourseEnabled(course);
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Cache is optional; Supabase remains the source of truth.
  }
}

export function filterCoursesWithCachedAvailability(courses: Course[]): Course[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return courses;
    const cache = JSON.parse(raw) as AvailabilityCache;
    return courses.filter(course => cache[course.id] !== false);
  } catch {
    return courses;
  }
}
