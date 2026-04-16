import axiosClient from "../api/axiosClient";

const DEFAULT_DASHBOARD_SOCKET_PATH = "/ws/admin/dashboard-analytics";
const MAX_RECONNECT_DELAY_MS = 10000;

function toSocketProtocol(protocol) {
    return protocol === "https:" ? "wss:" : "ws:";
}

function buildDashboardSocketUrl({ fromDate, toDate, groupBy }) {
    const explicitUrl = import.meta.env.VITE_ADMIN_DASHBOARD_WS_URL;

    if (explicitUrl) {
        const url = new URL(explicitUrl);
        if (fromDate) url.searchParams.set("fromDate", fromDate);
        if (toDate) url.searchParams.set("toDate", toDate);
        if (groupBy) url.searchParams.set("groupBy", groupBy);
        return url.toString();
    }

    const base = axiosClient.defaults.baseURL || window.location.origin;
    const baseUrl = base.startsWith("http")
        ? new URL(base)
        : new URL(base, window.location.origin);

    baseUrl.protocol = toSocketProtocol(baseUrl.protocol);
    baseUrl.pathname = DEFAULT_DASHBOARD_SOCKET_PATH;
    baseUrl.search = "";

    if (fromDate) baseUrl.searchParams.set("fromDate", fromDate);
    if (toDate) baseUrl.searchParams.set("toDate", toDate);
    if (groupBy) baseUrl.searchParams.set("groupBy", groupBy);

    return baseUrl.toString();
}

function normalizeSocketPayload(payload) {
    if (!payload || typeof payload !== "object") return null;

    const nested = payload.data?.data || payload.payload?.data;
    if (nested && typeof nested === "object") return nested;

    const direct = payload.data || payload.payload || payload.analytics;
    if (direct && typeof direct === "object") return direct;

    if (Array.isArray(payload.timeline) || payload.totalRevenue != null) {
        return payload;
    }

    return null;
}

function tryParseMessage(raw) {
    if (typeof raw !== "string") return normalizeSocketPayload(raw);

    try {
        const parsed = JSON.parse(raw);
        return normalizeSocketPayload(parsed);
    } catch {
        return null;
    }
}

export function connectDashboardSocket({
    fromDate,
    toDate,
    groupBy,
    onAnalytics,
    onError,
}) {
    let socket = null;
    let reconnectTimer = null;
    let reconnectAttempt = 0;
    let isDisposed = false;

    const connect = () => {
        if (isDisposed) return;

        const url = buildDashboardSocketUrl({ fromDate, toDate, groupBy });
        socket = new WebSocket(url);

        socket.onopen = () => {
            reconnectAttempt = 0;

            const subscribeMessage = {
                type: "SUBSCRIBE_DASHBOARD_ANALYTICS",
                payload: { fromDate, toDate, groupBy },
            };

            try {
                socket.send(JSON.stringify(subscribeMessage));
            } catch {
                //
            }
        };

        socket.onmessage = (event) => {
            const analytics = tryParseMessage(event.data);
            if (analytics) {
                onAnalytics?.(analytics);
            }
        };

        socket.onerror = (event) => {
            onError?.(new Error("Dashboard socket connection error"), event);
        };

        socket.onclose = () => {
            if (isDisposed) return;

            reconnectAttempt += 1;
            const delay = Math.min(1000 * 2 ** (reconnectAttempt - 1), MAX_RECONNECT_DELAY_MS);
            reconnectTimer = window.setTimeout(connect, delay);
        };
    };

    connect();

    return () => {
        isDisposed = true;

        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        if (
            socket &&
            (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
        ) {
            socket.close();
        }
    };
}