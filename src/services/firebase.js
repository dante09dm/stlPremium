import app from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import firebaseConfig from "./config";

class Firebase {
  constructor() {
    app.initializeApp(firebaseConfig);

    this.storage = app.storage();
    this.db = app.firestore();
    this.auth = app.auth();
  }

  // AUTH ACTIONS ------------

  createAccount = (email, password) =>
    this.auth.createUserWithEmailAndPassword(email, password);

  signIn = (email, password) =>
    this.auth.signInWithEmailAndPassword(email, password);

  signInWithGoogle = () =>
    this.auth.signInWithPopup(new app.auth.GoogleAuthProvider());

  signInWithFacebook = () =>
    this.auth.signInWithPopup(new app.auth.FacebookAuthProvider());

  signInWithGithub = () =>
    this.auth.signInWithPopup(new app.auth.GithubAuthProvider());

  signOut = () => this.auth.signOut();

  passwordReset = (email) => this.auth.sendPasswordResetEmail(email);

  addUser = (id, user) => this.db.collection("users").doc(id).set(user);

  getUser = (id) => this.db.collection("users").doc(id).get();

  passwordUpdate = (password) => this.auth.currentUser.updatePassword(password);

  changePassword = (currentPassword, newPassword) =>
    new Promise((resolve, reject) => {
      this.reauthenticate(currentPassword)
        .then(() => {
          const user = this.auth.currentUser;
          user
            .updatePassword(newPassword)
            .then(() => resolve("Password updated successfully!"))
            .catch((error) => reject(error));
        })
        .catch((error) => reject(error));
    });

  reauthenticate = (currentPassword) => {
    const user = this.auth.currentUser;
    const cred = app.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    return user.reauthenticateWithCredential(cred);
  };

  updateEmail = (currentPassword, newEmail) =>
    new Promise((resolve, reject) => {
      this.reauthenticate(currentPassword)
        .then(() => {
          const user = this.auth.currentUser;
          user
            .updateEmail(newEmail)
            .then(() => resolve("Email Successfully updated"))
            .catch((error) => reject(error));
        })
        .catch((error) => reject(error));
    });

  updateProfile = (id, updates) =>
    this.db.collection("users").doc(id).update(updates);

  onAuthStateChanged = () =>
    new Promise((resolve, reject) => {
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          resolve(user);
        } else {
          reject(new Error("Auth State Changed failed"));
        }
      });
    });

  saveBasketItems = (items, userId) =>
    this.db.collection("users").doc(userId).update({ basket: items });

  setAuthPersistence = () =>
    this.auth.setPersistence(app.auth.Auth.Persistence.LOCAL);

  // PRODUCT ACTIONS --------------

  getSingleProduct = (id) => this.db.collection("products").doc(id).get();

  getProducts = async (lastRefKey) => {
    try {
      const query = this.db
        .collection("products")
        .orderBy(app.firestore.FieldPath.documentId())
        .limit(12);

      if (lastRefKey) {
        query.startAfter(lastRefKey);
      }

      const snapshot = await query.get();
      const products = [];
      snapshot.forEach((doc) => products.push({ id: doc.id, ...doc.data() }));
      const lastKey = snapshot.docs[snapshot.docs.length - 1];

      return { products, lastKey };
    } catch (error) {
      throw new Error(error?.message || "Failed to fetch products.");
    }
  };

  getRecommendedProducts = (itemsCount = 12) => {
    return this.db
      .collection("products")
      .where("isRecommended", "==", true)
      .limit(itemsCount)
      .get();
  };

  getFeaturedProducts = (itemsCount = 12) => {
    return this.db
      .collection("products")
      .where("isFeatured", "==", true)
      .limit(itemsCount)
      .get();
  };

  searchProducts = async (searchKey) => {
    try {
      const productsRef = this.db.collection("products");

      const searchedNameRef = productsRef
        .orderBy("name_lower")
        .where("name_lower", ">=", searchKey)
        .where("name_lower", "<=", `${searchKey}\uf8ff`)
        .limit(12);

      const searchedKeywordsRef = productsRef
        .orderBy("dateAdded", "desc")
        .where("keywords", "array-contains-any", searchKey.split(" "))
        .limit(12);

      const [nameSnaps, keywordsSnaps] = await Promise.all([
        searchedNameRef.get(),
        searchedKeywordsRef.get(),
      ]);

      const searchedNameProducts = nameSnaps.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const searchedKeywordsProducts = keywordsSnaps.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const mergedProducts = [
        ...searchedNameProducts,
        ...searchedKeywordsProducts,
      ];
      const uniqueProducts = Array.from(
        new Map(mergedProducts.map((product) => [product.id, product])).values()
      );

      return { products: uniqueProducts };
    } catch (error) {
      throw new Error(error?.message || "Failed to search products.");
    }
  };

  addProduct = (id, product) =>
    this.db.collection("products").doc(id).set(product);

  generateKey = () => this.db.collection("products").doc().id;

  // Subir cualquier archivo (GLB, STL, imágenes) a Firebase Storage
  // path: ruta completa en Storage, ej: "products/abc123/models/0/preview.glb"
  storeFile = async (path, file) => {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error("User is not authenticated.");
      }

      const snapshot = await this.storage.ref(path).put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();

      return downloadURL;
    } catch (error) {
      throw new Error(error?.message || "Failed to store file.");
    }
  };

  // Se mantiene para compatibilidad con código existente que lo use
  storeImage = async (id, folder, imageFile) => {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error("User is not authenticated.");
      }

      const snapshot = await this.storage
        .ref(folder)
        .child(id)
        .put(imageFile);
      const downloadURL = await snapshot.ref.getDownloadURL();

      return downloadURL;
    } catch (error) {
      throw new Error(error?.message || "Failed to store image.");
    }
  };

  deleteImage = (id) =>
    this.storage.ref("products").child(id).delete();

  editProduct = (id, updates) =>
    this.db.collection("products").doc(id).update(updates);

  removeProduct = (id) =>
    this.db.collection("products").doc(id).delete();
}

const firebaseInstance = new Firebase();

export default firebaseInstance;

