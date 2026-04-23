import { supabase } from './supabaseClient';
import { offlineManager } from './offlineStore';

export const SYNC_ACTIONS = {
  UPDATE_PROFILE_NOTIFICATIONS: 'update_profile_notifications',
  UPSERT_USER_PREFERENCES: 'upsert_user_preferences',
  UPSERT_COURSE_PROGRESS: 'upsert_course_progress',
  UPSERT_OFFLINE_DOWNLOAD: 'upsert_offline_download',
};

const syncHandlers = {
  [SYNC_ACTIONS.UPDATE_PROFILE_NOTIFICATIONS]: async (payload, item) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        email_notifications: payload.email_notifications,
        push_notifications: payload.push_notifications,
      })
      .eq('id', item.userId);

    if (error) throw error;
  },

  [SYNC_ACTIONS.UPSERT_USER_PREFERENCES]: async (payload, item) => {
    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: item.userId,
          ...payload,
        },
        { onConflict: 'user_id' },
      );

    if (error) throw error;
  },

  [SYNC_ACTIONS.UPSERT_COURSE_PROGRESS]: async (payload, item) => {
    const { error } = await supabase
      .from('course_progress')
      .upsert(
        {
          user_id: item.userId,
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,video_id' },
      );

    if (error) throw error;
  },

  [SYNC_ACTIONS.UPSERT_OFFLINE_DOWNLOAD]: async (payload, item) => {
    const { error } = await supabase
      .from('offline_downloads')
      .upsert(
        {
          user_id: item.userId,
          ...payload,
        },
        { onConflict: 'user_id,lesson_id' },
      );

    if (error) throw error;
  },
};

export async function queueSyncAction(action, payload, userId) {
  if (!userId) return;
  await offlineManager.enqueueSync(action, payload, userId);
}

export async function flushPendingSync(userId, maxItems = 50) {
  if (!userId || !navigator.onLine) return { processed: 0, failed: 0 };

  let totalProcessed = 0;
  let totalFailed = 0;

  for (let i = 0; i < 5; i += 1) {
    const result = await offlineManager.processSyncQueue({
      userId,
      handlers: syncHandlers,
      maxItems,
    });

    totalProcessed += result.processed;
    totalFailed += result.failed;

    // Stop when nothing else is ready to process right now.
    if (result.processed === 0) break;
  }

  return { processed: totalProcessed, failed: totalFailed };
}
