import { auth } from '@/config/firebase';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<User | null>(null);
  const loading = ref(true);

  // Getters
  const isAuthenticated = computed(() => currentUser.value !== null);

  // Actions
  const initAuth = () => {
    onAuthStateChanged(auth, async (user) => {
      currentUser.value = user;
      loading.value = false;
    });
  };

  const registerUser = async (email: string, password: string, displayName: string): Promise<void> => {
    loading.value = true;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update the display name immediately after registration
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });

      if (currentUser.value !== null && !currentUser.value.emailVerified) {
        sendEmailVerification(currentUser.value);
      }
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    loading.value = true;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      currentUser.value = null;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const updateDisplayName = async (displayName: string): Promise<void> => {
    if (!currentUser.value) {
      throw new Error('No user is currently logged in');
    }

    try {
      await updateProfile(currentUser.value, {
        displayName: displayName,
      });
      // Refresh the current user to get updated profile
      await currentUser.value.reload();
    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  };

  const updateEmail = async (newEmail: string, currentPassword: string): Promise<void> => {
    if (!currentUser.value || !currentUser.value.email) {
      throw new Error('No user is currently logged in');
    }

    try {
      // Re-authenticate user before email change
      const credential = EmailAuthProvider.credential(currentUser.value.email, currentPassword);
      await reauthenticateWithCredential(currentUser.value, credential);

      // Update email
      await firebaseUpdateEmail(currentUser.value, newEmail);

      // Send verification email to new address
      await sendEmailVerification(currentUser.value);
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser.value || !currentUser.value.email) {
      throw new Error('No user is currently logged in');
    }

    try {
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(currentUser.value.email, currentPassword);
      await reauthenticateWithCredential(currentUser.value, credential);

      // Update password
      await firebaseUpdatePassword(currentUser.value, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const deleteAccount = async (currentPassword: string): Promise<void> => {
    if (!currentUser.value || !currentUser.value.email) {
      throw new Error('No user is currently logged in');
    }

    try {
      // Re-authenticate user before account deletion
      const credential = EmailAuthProvider.credential(currentUser.value.email, currentPassword);
      await reauthenticateWithCredential(currentUser.value, credential);

      // Delete user account
      await deleteUser(currentUser.value);
      currentUser.value = null;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const reloadUserData = async (): Promise<void> => {
    if (!currentUser.value) {
      throw new Error('No user is currently logged in');
    }

    try {
      await currentUser.value.reload();
      // After reload, we need to get the fresh user from auth
      // currentUser.value = auth.currentUser;
    } catch (error) {
      console.error('Error reloading user data:', error);
      throw error;
    }
  };

  return {
    // State
    currentUser,
    loading,
    // Getters
    isAuthenticated,
    // Actions
    initAuth,
    registerUser,
    login,
    logout,
    updateDisplayName,
    updateEmail,
    updatePassword,
    deleteAccount,
    reloadUserData,
  };
});
