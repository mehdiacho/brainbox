import { db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// Firestore data structure:
// /users/{userId}/ideas/{ideaId}
// /users/{userId}/ideas/{ideaId}/media/{mediaId} (optional subcollection if media gets very complex)

export const getIdeas = async (userId) => {
    const ideasCol = collection(db, `users/${userId}/ideas`);
    const ideaSnapshot = await getDocs(ideasCol);
    const ideaList = ideaSnapshot.docs.map(doc => doc.data());
    return ideaList;
};

export const saveIdea = async (userId, idea) => {
    const ideaRef = doc(db, `users/${userId}/ideas`, idea.id.toString());
    await setDoc(ideaRef, idea, { merge: true });
};

export const deleteIdea = async (userId, ideaId) => {
    await deleteDoc(doc(db, `users/${userId}/ideas`, ideaId.toString()));
};

export const importIdeas = async (userId, ideas) => {
    const batch = writeBatch(db);
    ideas.forEach(idea => {
        const ideaRef = doc(db, `users/${userId}/ideas`, idea.id.toString());
        batch.set(ideaRef, idea);
    });
    await batch.commit();
};