import { supabase } from '@/lib/supabase';

/**
 * Uploads a local IndexedDB audio file to Supabase Storage in the 'audios' bucket
 * and returns its public URL. It automatically attempts to create the bucket if missing.
 * 
 * @param file The audio File object
 * @param id The audio ID
 * @returns The public URL of the uploaded file, or null if it fails
 */
export async function uploadAudioToSupabase(file: File, id: number): Promise<string | null> {
    try {
        const fileExt = file.name.split('.').pop() || 'mp3';
        const fileName = `${id}.${fileExt}`;
        const filePath = `session-audios/${fileName}`;

        // Attempt upload
        let { error } = await supabase.storage
            .from('audios')
            .upload(filePath, file, { upsert: true });

        // If bucket doesn't exist, create it and retry upload
        if (error && (error.message.includes('bucket') || error.message.includes('not found') || (error as any).statusCode === '404' || (error as any).status === 404)) {
            try {
                const { error: bucketError } = await supabase.storage.createBucket('audios', {
                    public: true,
                });
                if (bucketError) {
                    console.error('Failed to create bucket "audios":', bucketError);
                } else {
                    // Retry upload
                    const retryResult = await supabase.storage
                        .from('audios')
                        .upload(filePath, file, { upsert: true });
                    error = retryResult.error;
                }
            } catch (err) {
                console.error('Exception creating bucket:', err);
            }
        }

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('audios')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (err) {
        console.error('Failed to upload audio to Supabase Storage:', err);
        return null;
    }
}
