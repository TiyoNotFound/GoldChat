// Firebase database operations
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase"

export interface Post {
  id?: string
  username: string
  profilePic: string
  content: string
  imageUrl?: string
  timestamp: any
  likes: number
  comments: number
}

export interface UserProfile {
  id?: string
  username: string
  profilePic: string
  bio: string
  createdAt: any
}

// User Profile Operations
export const createUserProfile = async (profile: Omit<UserProfile, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...profile,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating user profile:", error)
    throw error
  }
}

export const getUserProfiles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserProfile[]
  } catch (error) {
    console.error("Error fetching user profiles:", error)
    throw error
  }
}

// Post Operations
export const createPost = async (post: Omit<Post, "id" | "timestamp">) => {
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      ...post,
      timestamp: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating post:", error)
    throw error
  }
}

export const getPosts = async () => {
  try {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[]
  } catch (error) {
    console.error("Error fetching posts:", error)
    throw error
  }
}

export const likePost = async (postId: string) => {
  try {
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
      likes: increment(1),
    })
  } catch (error) {
    console.error("Error liking post:", error)
    throw error
  }
}

// Image Upload
export const uploadImage = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}
