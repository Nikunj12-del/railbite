
import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { io } from "socket.io-client";
import { API_URL } from "../services/api";

const SocketContext = createContext({
    socket: null,
    connected: false,
    connectSocket: () => {},
    disconnectSocket: () => {},
    reconnectSocket: () => {}
});

export function SocketProvider({ children, user = null }) {
    const [socket] = useState(() =>
        io(API_URL, {
            withCredentials: true,
            autoConnect: false,
            transports: ["websocket", "polling"]
        })
    );
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            setConnected(true);
            console.log(
                "RailBite socket connected:",
                socket.id
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

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.disconnect();
        };
    }, [socket]);

    // Connect only after session is verified/logged in; disconnect on logout
    useEffect(() => {
        if (!socket) return;

        if (user) {
            if (!socket.connected) {
                socket.connect();
            }
        } else {
            if (socket.connected) {
                socket.disconnect();
            }
        }
    }, [socket, user]);

    const connectSocket = () => {
        if (socket && !socket.connected) {
            socket.connect();
        }
    };

    const disconnectSocket = () => {
        if (socket?.connected) {
            socket.disconnect();
        }
        setConnected(false);
    };

    const reconnectSocket = () => {
        if (socket) {
            socket.disconnect();
            socket.connect();
        }
    };

    return React.createElement(
        SocketContext.Provider,
        {
            value: {
                socket,
                connected,
                connectSocket,
                disconnectSocket,
                reconnectSocket
            }
        },
        children
    );
}

export function useSocket() {
    return useContext(SocketContext);
}

export default useSocket;
