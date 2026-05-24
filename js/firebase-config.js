const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyBcaATj4rv7cXFPmje_mPcb55q_hgHYd0o",
    authDomain:        "identlq.firebaseapp.com",
    projectId:         "identlq",
    storageBucket:     "identlq.firebasestorage.app",
    messagingSenderId: "1043751752869",
    appId:             "1:1043751752869:web:d55a7e550d7d0eacde694c",
    measurementId:     "G-Q0NT2KNGDJ"
};

if (typeof firebase === 'undefined') {
    console.error('[NexusID] Firebase SDK not loaded. Make sure the CDN <script> tags appear before this file.');
}

let _firebaseApp;
try {
    _firebaseApp = firebase.app(); // already initialised (e.g. HMR)
} catch (_) {
    _firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
}

const auth         = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(err => console.warn('[NexusID] Auth persistence error:', err));

/**
 * Register a new user with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<firebase.auth.UserCredential>}
 */
async function nexusRegister(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
}

/**
 * Sign in an existing user with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<firebase.auth.UserCredential>}
 */
async function nexusLogin(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

/**
 * Sign in with Google popup.
 * @returns {Promise<firebase.auth.UserCredential>}
 */
async function nexusGoogleLogin() {
    return auth.signInWithPopup(googleProvider);
}

/**
 * Send a password-reset email.
 * @param {string} email
 * @returns {Promise<void>}
 */
async function nexusForgotPassword(email) {
    return auth.sendPasswordResetEmail(email);
}

/**
 * Sign out the current user.
 * @returns {Promise<void>}
 */
async function nexusSignOut() {
    return auth.signOut();
}

/**
 * Get the currently authenticated user (or null).
 * @returns {firebase.User|null}
 */
function nexusCurrentUser() {
    return auth.currentUser;
}

/**
 * Subscribe to auth-state changes.
 * @param {function(firebase.User|null):void} callback
 * @returns {firebase.Unsubscribe}
 */
function nexusOnAuthChanged(callback) {
    return auth.onAuthStateChanged(callback);
}

function nexusFirebaseError(code) {
    const MAP = {
        /* Login */
        'auth/user-not-found':        'No account found with this email.',
        'auth/wrong-password':        'Incorrect password. Please try again.',
        'auth/invalid-email':         'Invalid email address format.',
        'auth/user-disabled':         'This account has been disabled.',
        'auth/invalid-credential':    'Invalid credentials. Please try again.',
        /* Register */
        'auth/email-already-in-use':  'An account with this email already exists.',
        'auth/weak-password':         'Password must be at least 6 characters.',
        'auth/operation-not-allowed': 'Email/password sign-in is not enabled.',
        /* Google */
        'auth/popup-closed-by-user':  'Google sign-in was cancelled.',
        'auth/popup-blocked':         'Browser blocked the sign-in popup. Please allow popups.',
        'auth/cancelled-popup-request': 'Another sign-in is in progress.',
        /* Reset */
        'auth/too-many-requests':     'Too many attempts. Please try again later.',
        'auth/network-request-failed':'Network error. Check your connection.',
    };
    return MAP[code] || 'An unexpected error occurred. Please try again.';
}

window.NexusAuth = {
    register:        nexusRegister,
    login:           nexusLogin,
    googleLogin:     nexusGoogleLogin,
    forgotPassword:  nexusForgotPassword,
    signOut:         nexusSignOut,
    currentUser:     nexusCurrentUser,
    onAuthChanged:   nexusOnAuthChanged,
    errorMessage:    nexusFirebaseError,
};

console.log('[NexusID] Firebase Auth ready. Project:', FIREBASE_CONFIG.projectId);