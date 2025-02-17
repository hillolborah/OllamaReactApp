import React from "react";
import "./Header.css";

const Header = () => {
    return (
        <header className="header">
            <h1>Local Ollama</h1>
            <nav>
                <a href="#">Contact</a>
                <button>Sign In</button>
                <button>Sign Up</button>
            </nav>
        </header>
    );
};

export default Header;
