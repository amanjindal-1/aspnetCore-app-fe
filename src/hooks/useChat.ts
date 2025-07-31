import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useEffect, useState } from "react";

export function useChat(userId: number) {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        if (!userId) return;

        const newConnection = new HubConnectionBuilder()
            .withUrl(`https://localhost:7185/chathub?userId=${userId}`)
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        return () => {
            newConnection.stop();
        };
    }, [userId]);

    console.log(messages);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    connection.on('ReceiveMessage', (senderId, content, receiverId, sentAt, messageId) => {
                        setMessages(prev => [...prev, { senderId, content, receiverId, sentAt, id: messageId }]);
                    });

                    connection.on('MessagesRead', (readerUserId, readMessageIds) => {
                        setMessages(prevMessages => {
                            return prevMessages.map(msg => {
                                if (readMessageIds.includes(msg.id)) {
                                    return {
                                        ...msg,
                                        read: true,
                                    };
                                }
                                return msg;
                            });
                        });
                    });
                })
                .catch(console.error);
        }
    }, [connection]);

    const sendMessage = (receiverId: number, message: string) => {
        if (connection) {
            connection.invoke('SendMessage', receiverId, message).catch(console.error);
        }
    };

    const markAsRead = (messageIds: number[]) => {
        if (connection && messageIds.length) {
            console.log(messageIds);
            connection.invoke('MarkAsRead', messageIds).catch(console.error);
        }
    };

    return { messages, sendMessage, markAsRead };
}