import { storage } from './firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

// Storage structure:
// /users/{userId}/{ideaId}/{mediaId}-{fileName}

export const uploadMediaFile = async (userId, ideaId, mediaId, fileDataUrl, fileName) => {
    const filePath = `users/${userId}/${ideaId}/${mediaId}-${fileName}`;
    const storageRef = ref(storage, filePath);
    
    // Upload file as a data URL string
    const snapshot = await uploadString(storageRef, fileDataUrl, 'data_url');
    
    // Get the public URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};