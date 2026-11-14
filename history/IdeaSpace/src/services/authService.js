import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const signUp = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName });
    // Create a user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName,
        email,
        tier: 'free', // All new users start on the free tier
        aiQuota: 15,
        preferences: { autoTranscribe: false, autoAnalyze: false }
    });
    return user;
};

export const signIn = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const logOut = () => {
    return signOut(auth);
};

export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

export const getUserProfile = async (uid) => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc.data();
    }
    return null;
};

export const updateUserProfile = async (uid, profileData) => {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, profileData, { merge: true });
    if (auth.currentUser && profileData.displayName) {
        await updateProfile(auth.currentUser, { displayName: profileData.displayName });
    }
};