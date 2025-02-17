import React, { useState, useRef, useEffect } from "react";
import "./MainContent.css";
import Header from "./Header"; // Import Header component

const MainContent = () => {
    const [prompt, setPrompt] = useState(""); // User input
    const [messages, setMessages] = useState([]); // Chat history
    const [models, setModels] = useState([]); // Available models
    const [selectedModel, setSelectedModel] = useState("deepseek-r1:14b"); // Default model
    const [showDropdown, setShowDropdown] = useState(false); // Toggle model selection dropdown
    const messagesEndRef = useRef(null); // Auto-scroll reference

    // Fetch models from API when component mounts
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch("http://127.0.0.1:8000/models/");
                const data = await res.json();
                setModels(data.models); // Assuming response has { models: ["model1", "model2", ...] }
            } catch (error) {
                console.error("Error fetching models:", error);
            }
        };

        fetchModels();
    }, []);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!prompt.trim()) return; // Ignore empty input

        // Add user input to chat history
        setMessages((prev) => [...prev, { sender: "user", text: prompt }]);

        const apiUrl = "http://127.0.0.1:8000/chat/";

        try {
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, model: selectedModel }),
            });

            if (!res.body) {
                throw new Error("No response body");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let botMessage = { sender: "bot", text: "" };

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const parsedChunk = JSON.parse(chunk); // Parse JSON stream

                botMessage.text += parsedChunk.response; // Append chunk to bot's message

                // ✅ Append bot response instead of replacing it
                setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1];

                    if (lastMsg?.sender === "bot") {
                        return [
                            ...prev.slice(0, -1), // Remove last bot message
                            { ...lastMsg, text: lastMsg.text + parsedChunk.response },
                        ];
                    } else {
                        return [...prev, { sender: "bot", text: parsedChunk.response }];
                    }
                });
            }
        } catch (error) {
            console.error("Error fetching response:", error);
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Error: Failed to fetch response." },
            ]);
        }

        setPrompt(""); // Clear input field
    };

    return (
        <main className="main-content">
            <div className="fixed-header">
    {/* Settings Icon to Toggle Dropdown */}
    <span
        className="settings-icon"
        onClick={() => setShowDropdown((prev) => !prev)}
    >
        ⚙️
    </span>

    {/* Selected Model Name */}
    <h1>{selectedModel}</h1>
</div>


            {/* Dropdown for selecting a model */}
            {showDropdown && (
                <div className="dropdown">
                    {models.map((model) => (
                        <div
                            key={model}
                            className="dropdown-item"
                            onClick={() => {
                                setSelectedModel(model);
                                setShowDropdown(false); // Hide dropdown after selection
                            }}
                        >
                            {model}
                        </div>
                    ))}
                </div>
            )}

            {/* Scrollable Chat Container */}
            <div className="chat-container">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                <div ref={messagesEndRef} /> {/* Auto-scroll anchor */}
            </div>

            {/* Input Field (Fixed at Bottom) */}
            <div className="input-container">
                <input
                    type="text"
                    placeholder="Enter prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </main>
    );
};

export default MainContent;
