import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { Component } from "react";

import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";

import { db } from "../config";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
  increment,
} from "firebase/firestore";

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export class Transaction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookId: "",
      studentId: "",
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false,
      bookName: "",
      studentName: "",
    };
  }

  getCameraPermissions = async (domState) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      hasCameraPermissions: status === "granted", //permiso concedido
      domState: domState,
      scanned: false,
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { domState } = this.state;

    if (domState === "bookId") {
      this.setState({
        bookId: data,
        domState: "normal",
        scanned: true,
      });
    } else if (domState === "studentId") {
      this.setState({
        studentId: data,
        domState: "normal",
        scanned: true,
      });
    }
  };

  handleTransaction = async () => {
    var { bookId, studentId } = this.state;
    await this.getBookDetails(bookId);
    await this.getStudentDetails(studentId);

    var transactionType = await this.checkBookAvailability(bookId);

    if (!transactionType) {
      this.setState({ bookId: "", studentId: "" });
      // Solo para usuarios de Android
      // ToastAndroid.show("¡El libro no existe en la base de datos!", ToastAndroid.SHORT);
      Alert.alert("¡El libro no existe en la base de datos!");
    } else if (transactionType === "issue") {
      var isEligible = await this.checkStudentEligibilityForBookIssue(
        studentId
      );

      if (isEligible == true) {
        var { bookName, studentName } = this.state;
        this.initiateBookIssue(bookId, studentId, bookName, studentName);
        Alert.alert("¡Libro prestado al estudiante!");
      }
    } else {
      var isEligible = await this.checkStudentEligibilityForBookReturn(
        bookId,
        studentId
      );

      if (isEligible) {
        var { bookName, studentName } = this.state;
        this.initiateBookReturn(bookId, studentId, bookName, studentName);
      }
      // For Android users only
      // ToastAndroid.show("Book returned to the library!", ToastAndroid.SHORT);
      Alert.alert("¡Libro regresado a la biblioteca!");
    }
  };

  getBookDetails = async (bookId) => {
    bookId = bookId.trim();
    const querySnapshot = await getDocs(
      query(
        collection(db, "books"),
        where("book_details.book_id", "==", bookId)
      )
    );

    querySnapshot.docs.map((doc) => {
      this.setState({
        bookName: doc.data().book_details.book_name,
      });
    });
  };

  getStudentDetails = async (studentId) => {
    studentId = studentId.trim();
    const querySnapshot = await getDocs(
      query(
        collection(db, "students"),
        where("student_details.student_id", "==", studentId)
      )
    );
    querySnapshot.docs.map((doc) => {
      this.setState({
        studentName: doc.data().student_details.student_name,
      });
    });
  };

  checkBookAvailability = async (bookId) => {
    const bookRef = await getDocs(
      query(
        collection(db, "books"),
        where("book_details.book_id", "==", bookId)
      )
    );

    var transactionType = "";
    if (bookRef.docs.length == 0) {
      transactionType = false;
    } else {
      bookRef.docs.map((doc) => {
        // Si el libro está disponible, entonces el tipo de de transacción será préstamo (issue)
        // de lo contrario, será regreso (return)
        transactionType = doc.data().book_details.is_book_available
          ? "issue"
          : "return";
      });
    }
    return transactionType;
  };

  checkStudentEligibilityForBookIssue = async (studentId) => {
    const studentRef = await getDocs(
      query(
        collection(db, "students"),
        where("student_details.student_id", "==", studentId),
        limit(1)
      )
    );

    var isStudentEligible = "";

    if (studentRef.docs.length == 0) {
      this.setState({
        bookId: "",
        studentId: "",
      });
      isStudentEligible = false;
      Alert.alert("¡El estudiante no existe en la base de datos!");
    } else {
      studentRef.docs.map((doc) => {
        if (doc.data().number_of_books_issued < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          Alert.alert("¡El estudiante ya tiene 2 libros!");
          this.setState({
            bookId: "",
            studentId: "",
          });
        }
      });
    }

    return isStudentEligible;
  };

  checkStudentEligibilityForBookReturn = async (bookId, studentId) => {
    const transactionRef = await getDocs(
      query(
        collection(db, "transactions"),
        where("book_details.book_id", "==", bookId),
        limit(1)
      )
    );
    var isStudentEligible = "";
    transactionRef.docs.map((doc) => {
      var lastBookTransaction = doc.data();
      if (lastBookTransaction.student_id === studentId) {
        isStudentEligible = true;
      } else {
        isStudentEligible = false;
        Alert.alert("¡El libro no se le prestó a este estudiante!");
        this.setState({
          bookId: "",
          studentId: "",
        });
      }
    });
    return isStudentEligible;
  };

  initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
    //add a transaction
    await addDoc(collection(db, "transactions"), {
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: Timestamp.now().toDate(),
      transaction_type: "issue",
    });
    //change book status
    await updateDoc(doc(db, "books", bookId), {
      "book_details.is_book_available": false,
    });
    //change number  of issued books for student
    await updateDoc(doc(db, "students", studentId), {
      number_of_books_issued: increment(1),
    });
    // Updating local state
    this.setState({
      bookId: "",
      studentId: "",
    });
  };

  initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
    //add a transaction
    await addDoc(collection(db, "transactions"), {
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: Timestamp.now().toDate(),
      transaction_type: "return",
    });
    //change book status
    await updateDoc(doc(db, "books", bookId), {
      "book_details.is_book_available": true,
    });
    //change number  of issued books for student
    await updateDoc(doc(db, "students", studentId), {
      number_of_books_issued: increment(-1),
    });
    // Updating local state
    this.setState({
      bookId: "",
      studentId: "",
    });
  };

  render() {
    const { bookId, studentId, domState, scanned } = this.state;

    if (domState !== "normal") {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <ImageBackground source={bgImage} style={styles.bgImage}>
          <View style={styles.upperContainer}>
            <Image source={appIcon} style={styles.appIcon} />
            <Image source={appName} style={styles.appName} />
          </View>
          <View style={styles.lowerContainer}>
            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textinput}
                placeholder={"Id del libro"}
                placeholderTextColor={"#FFFFFF"}
                value={bookId}
                onChangeText={(text) => this.setState({ bookId: text })}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("bookId")}
              >
                <Text style={styles.scanbuttonText}>Escanear</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textinputContainer, { marginTop: 25 }]}>
              <TextInput
                style={styles.textinput}
                placeholder={"Id del estudiante"}
                placeholderTextColor={"#FFFFFF"}
                value={studentId}
                onChangeText={(text) => this.setState({ studentId: text })}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("studentId")}
              >
                <Text style={styles.scanbuttonText}>Escanear</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, { marginTop: 25 }]}
              onPress={this.handleTransaction}
            >
              <Text style={styles.buttonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }
}

export default Transaction;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80,
  },
  appName: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: "center",
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF",
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    fontFamily: "Rajdhani_600SemiBold",
    color: "#FFFFFF",
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scanbuttonText: {
    fontSize: 24,
    color: "#0A0101",
    fontFamily: "Rajdhani_600SemiBold",
  },
  button: {
    width: "43%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F48D20",
    borderRadius: 15,
  },
  buttonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: "Rajdhani_600SemiBold",
  },
});
