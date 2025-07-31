import { useEffect, useState } from "react";
import UserSelector from "./user-selector";
import { useChat } from "../hooks/useChat";

export default function ChatApp() {
    const [users, setUsers] = useState([{ id: 1, name: "Aman" }, { id: 2, name: "Imran" }]);
    const [currentUserId, setCurrentUserId] = useState(0);
    const [chatPartnerId, setChatPartnerId] = useState(0);
    const [chatMessages, setChatMessages] = useState<any[]>([]);


    const { messages, sendMessage, markAsRead } = useChat(currentUserId);

    useEffect(() => {
        async function loadChatHistory() {
            if (!currentUserId || !chatPartnerId) {
                setChatMessages([]);
                return;
            }
            try {
                const res = await fetch(`https://localhost:7185/api/v1/chat/${currentUserId}/${chatPartnerId}`);
                if (res.ok) {
                    const data = await res.json();
                    setChatMessages(data);
                } else {
                    setChatMessages([]);
                }
            } catch (err) {
                setChatMessages([]);
                console.error(err);
            }
        }
        loadChatHistory();
    }, [currentUserId, chatPartnerId]);

    useEffect(() => {
        if (!messages.length) return;
        const relevantMessages = messages.filter(m =>
            (m.senderId === currentUserId && m.receiverId === chatPartnerId) ||
            (m.senderId === chatPartnerId && m.receiverId === currentUserId)
        );

        if (relevantMessages.length) {
            setChatMessages((prev: any[]) => {
                const existingIds = new Set(prev.map(msg => msg.id));
                const newMessages = relevantMessages.filter(m => !existingIds.has(m.id));

                if (newMessages.length === 0) {
                    return prev; // No new messages to add
                }

                return [...prev, ...newMessages];
            });
        }
    }, [messages, currentUserId, chatPartnerId]);

    useEffect(() => {
        if (!chatMessages.length) return;

        // Find unread messages sent by chatPartnerId (the current other user)
        const unreadMessageIds = chatMessages
            .filter(msg => !msg.read && msg.senderId === chatPartnerId)
            .map(msg => msg.id);

        if (unreadMessageIds.length > 0) {
            markAsRead(unreadMessageIds);
        }
    }, [chatMessages, chatPartnerId, markAsRead]);

    // Handle 'MessagesRead' event from SignalR server to update UI
    useEffect(() => {
        if (!messages.length) return;

        const readMessageIdsFromPartner = messages
            .filter(msg => msg.read && msg.receiverId === currentUserId)
            .map(msg => msg.id);

        if (readMessageIdsFromPartner.length > 0) {
            setChatMessages(prevMessages =>
                prevMessages.map(msg =>
                    readMessageIdsFromPartner.includes(msg.id)
                        ? { ...msg, read: true }
                        : msg
                )
            );
        }
    }, [messages, currentUserId]);

    const [newMessage, setNewMessage] = useState("");

    function handleSend() {
        if (newMessage.trim() && currentUserId && chatPartnerId) {
            sendMessage(chatPartnerId, newMessage.trim());
            setNewMessage("");
        }
    }

    return (
        <div>
            <UserSelector
                users={users}
                selectedUserId={currentUserId}
                onChange={setCurrentUserId}
                label="You"
            />
            <UserSelector
                users={users}
                selectedUserId={chatPartnerId}
                onChange={setChatPartnerId}
                label="Chat with"
            />

            <div style={{ border: "1px solid #ccc", height: "300px", overflowY: "auto", marginTop: 20 }}>
                {chatMessages.map(msg => (
                    <div key={msg.id} style={{ textAlign: msg.senderId === currentUserId ? "right" : "left", padding: 5 }}>
                        <b>{msg.senderId === currentUserId ? "You" : users.find(u => u.id === msg.senderId)?.name}:</b> {msg.content}
                        <br />
                        <small>{new Date(msg.sentAt).toLocaleString()}</small>&nbsp; //
                        <small>{msg.read ? "Read" : "Unread"}</small>
                    </div>
                ))}
            </div>

            {currentUserId && chatPartnerId && (
                <div style={{ marginTop: 10 }}>
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        style={{ width: "70%" }}
                    />
                    <button onClick={handleSend} style={{ width: "25%", marginLeft: "5%" }}>
                        Send
                    </button>
                </div>
            )}
        </div>
    );
}