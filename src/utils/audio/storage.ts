/**
 * Dummy function since Supabase has been removed.
 * Returns null immediately so the app falls back to IndexedDB.
 * 
 * @param file The audio File object
 * @param id The audio ID
 * @returns null
 */
export async function uploadAudioToSupabase(file: File, id: number): Promise<string | null> {
    return null;
}

