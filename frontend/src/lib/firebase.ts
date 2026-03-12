import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA6VZKHajr2m-QNZxY9tx2J03iMW7q0ZFg",
  authDomain: "localskill-hub.firebaseapp.com",
  projectId: "localskill-hub",
  storageBucket: "localskill-hub.firebasestorage.app",
  messagingSenderId: "335207606338",
  appId: "1:335207606338:web:a905763f88c1a5083ca5db",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");

export default app;
