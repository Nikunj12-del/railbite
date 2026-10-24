
import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8085";

const SocketContext = createContext({
    socket: null,
    connected: false
});

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socketInstance = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: false,
            transports: ["websocket", "polling"]
        });

        const handleConnect = () => {
            setConnected(true);
            console.log(
                "RailBite socket connected:",
                socketInstance.id
            );
        };

        const handleDisconnect = (reason) => {
            setConnected(false);
            console.log(
                "RailBite socket disconnected:",
                reason
            );
        };

        const handleConnectError = (error) => {
            setConnected(false);
            console.error(
                "RailBite socket connection error:",
                error.message
            );
        };

        socketInstance.on("connect", handleConnect);
        socketInstance.on("disconnect", handleDisconnect);
        socketInstance.on("connect_error", handleConnectError);

        setSocket(socketInstance);

        // Connect only after the socket is initialized.
        socketInstance.connect();

        return () => {
            socketInstance.off("connect", handleConnect);
            socketInstance.off("disconnect", handleDisconnect);
            socketInstance.off("connect_error", handleConnectError);
            socketInstance.disconnect();
        };
    }, []);

    return React.createElement(
        SocketContext.Provider,
        {
            value: {
                socket,
                connected,
                reconnectSocket: () => {
                    if (socket) {
                        socket.disconnect();
                        socket.connect();
                    }
                }
            }
        },
        children
    );
}

export function useSocket() {
    return useContext(SocketContext);
}

export default useSocket;
