/**
 * Classroom Mode Plugin Example
 * Demonstrates how to create a classroom monitoring mode
 */

import {
  createClassroomModePlugin,
  type ClassroomModeConfig,
  type AttendanceRecord,
} from '../src/plugins/modePlugin';

/**
 * Example classroom mode plugin implementation
 */
class ClassroomModeHandler {
  private plugin: ReturnType<typeof createClassroomModePlugin>;

  constructor() {
    const config: ClassroomModeConfig = {
      attendance_tracking: true,
      focus_detection: true,
      noise_level_threshold: 60, // dB
      permitted_zones: ['front_rows', 'teacher-area'],
      prohibited_objects: ['phone', 'laptop', 'tablet'],
      alert_on_exits: true,
    };

    this.plugin = createClassroomModePlugin('classroom-mode-v1', 'Classroom Mode', config);
  }

  /**
   * Activate the mode
   */
  async activate(): Promise<void> {
    console.log('[ClassroomMode] Activating...');
    await this.plugin.onActivate?.();
    console.log('[ClassroomMode] Activated');
  }

  /**
   * Deactivate the mode
   */
  async deactivate(): Promise<void> {
    console.log('[ClassroomMode] Deactivating...');
    await this.plugin.onDeactivate?.();
    console.log('[ClassroomMode] Deactivated');
  }

  /**
   * Get current attendance
   */
  async getAttendance(): Promise<AttendanceRecord[]> {
    return this.plugin.getAttendance();
  }

  /**
   * Get classroom focus score (0-100)
   */
  async getFocusScore(): Promise<number> {
    return this.plugin.getFocusScore();
  }

  /**
   * Get current noise level in dB
   */
  async getNoiseLevel(): Promise<number> {
    return this.plugin.getNoiseLevel();
  }

  /**
   * Check if an object is prohibited
   */
  isProhibitedObject(label: string): boolean {
    return this.plugin.config.prohibited_objects.includes(label.toLowerCase());
  }
}

// Usage example
async function example() {
  const classroom = new ClassroomModeHandler();

  await classroom.activate();

  // Simulate attendance check
  const attendance = await classroom.getAttendance();
  console.log(`[ClassroomMode] Attendance: ${attendance.length} records`);

  const focusScore = await classroom.getFocusScore();
  console.log(`[ClassroomMode] Focus score: ${focusScore}/100`);

  const noiseLevel = await classroom.getNoiseLevel();
  console.log(`[ClassroomMode] Noise level: ${noiseLevel} dB`);

  await classroom.deactivate();
}

export { ClassroomModeHandler };
export default { ClassroomModeHandler };