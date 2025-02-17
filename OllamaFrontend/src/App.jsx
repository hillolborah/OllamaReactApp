import React from "react";
import Header from "./components/Header";
import MainContent from "./components/MainContent";
import Footer from "./components/Footer";
import "./App.css";

const App = () => {
    return (
        <div className="app-container">
            <Header />
            <MainContent />
            <Footer />
        </div>
    );
};

export default App;
