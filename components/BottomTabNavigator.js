import React, { Component } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Transaction from "../screens/Transaction";
import Search from "../screens/Search";
import Ionicons from "react-native-vector-icons/Ionicons";

const Tab = createBottomTabNavigator();

export class BottomTabNavigator extends Component {
  render() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Transacción") {
              iconName = "book";
            } else if (route.name === "Búsqueda") {
              iconName = "search";
            }

            // Aquí tu puedes regresar el componente que te guste!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "black",
          tabBarLabelStyle: {
            fontSize: 20,
            fontFamily: "Rajdhani_600SemiBold",
          },
          tabBarItemStyle: {
            marginTop: 25,
            marginLeft: 10,
            marginRight: 10,
            borderRadius: 30,
            borderWidth: 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#5653d4",
          },
          headerShown: false,
          tabBarLabelPosition: "beside-icon",
          tabBarStyle: [
            {
              display: "flex",
            },
            null,
          ],
        })}
      >
        <Tab.Screen name="Transacción" component={Transaction} />
        <Tab.Screen name="Búsqueda" component={Search} />
      </Tab.Navigator>
    );
  }
}

export default BottomTabNavigator;
