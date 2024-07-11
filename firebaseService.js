const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} = require("firebase/firestore");

const firebaseConfig = {
  // apiKey: "AIzaSyAyezd2fLKRHaHQDFgBGtZGA4sLPa8n3jo",
  // authDomain: "presentation-manager-b9bf8.firebaseapp.com",
  // projectId: "presentation-manager-b9bf8",
  // storageBucket: "presentation-manager-b9bf8.appspot.com",
  // messagingSenderId: "879003706980",
  // appId: "1:879003706980:web:d89e9b0122860c811ea171"


  apiKey: "AIzaSyAXdsMeZj88lGRyva5Ac5gOdQ80X7Q_PHU",
  authDomain: "dbaas-f9c98.firebaseapp.com",
  projectId: "dbaas-f9c98",
  storageBucket: "dbaas-f9c98.appspot.com",
  messagingSenderId: "820380123829",
  appId: "1:820380123829:web:bdd9a35ed4121479c774fc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const firebaseService = {
  addDevices: async (devices) => {
    // console.log("inside add devices : ", devices);
    await Promise.all(devices.map(async (device) => {
      // Check if document with same IP exists
      const q = query(collection(db, "devices"), where("ip", "==", device.ip));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.size > 0) {
        return;
      } else {
        // If document doesn't exist, add new document
        const docRef = await addDoc(collection(db, "devices"), device);
        console.log("New document added with ID: ", docRef.id);
      }
    }));
    console.log("Data saved to Firebase successfully!");
  }
};

module.exports = firebaseService;
