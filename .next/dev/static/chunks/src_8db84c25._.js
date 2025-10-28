(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/hooks/use-toast.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "reducer",
    ()=>reducer,
    "toast",
    ()=>toast,
    "useToast",
    ()=>useToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST"
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId)=>{
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(()=>{
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action)=>{
    switch(action.type){
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, TOAST_LIMIT)
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case "DISMISS_TOAST":
            {
                const { toastId } = action;
                // ! Side effects ! - This could be extracted into a dismissToast() action,
                // but I'll keep it here for simplicity
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    state.toasts.forEach((toast)=>{
                        addToRemoveQueue(toast.id);
                    });
                }
                return {
                    ...state,
                    toasts: state.toasts.map((t)=>t.id === toastId || toastId === undefined ? {
                            ...t,
                            open: false
                        } : t)
                };
            }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: []
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const listeners = [];
let memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener)=>{
        listener(memoryState);
    });
}
function toast({ ...props }) {
    const id = genId();
    const update = (props)=>dispatch({
            type: "UPDATE_TOAST",
            toast: {
                ...props,
                id
            }
        });
    const dismiss = ()=>dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss,
        update
    };
}
function useToast() {
    _s();
    const [state, setState] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](memoryState);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useToast.useEffect": ()=>{
            listeners.push(setState);
            return ({
                "useToast.useEffect": ()=>{
                    const index = listeners.indexOf(setState);
                    if (index > -1) {
                        listeners.splice(index, 1);
                    }
                }
            })["useToast.useEffect"];
        }
    }["useToast.useEffect"], [
        state
    ]);
    return {
        ...state,
        toast,
        dismiss: (toastId)=>dispatch({
                type: "DISMISS_TOAST",
                toastId
            })
    };
}
_s(useToast, "SPWE98mLGnlsnNfIwu/IAKTSZtk=");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/PhoneConfigProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PhoneConfigProvider",
    ()=>PhoneConfigProvider,
    "useMarbleFallsPhone",
    ()=>useMarbleFallsPhone,
    "usePhoneConfig",
    ()=>usePhoneConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
"use client";
;
const DEFAULT_PHONE = {
    display: '(512) 368-9159',
    tel: 'tel:+15123689159'
};
const MARBLE_FALLS_PHONE = {
    display: '(830) 460-3565',
    tel: 'tel:+18304603565'
};
const PhoneConfigContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(DEFAULT_PHONE);
_c = PhoneConfigContext;
const MarbleFallsPhoneContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(MARBLE_FALLS_PHONE);
_c1 = MarbleFallsPhoneContext;
const COOKIE_NAME = 'traffic_source';
const COOKIE_DAYS = 90;
function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}
function setCookie(name, value, days) {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}
function detectTrafficSource(trackingNumbers) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer.toLowerCase();
    const utmSource = urlParams.get('utm_source')?.toLowerCase();
    for (const number of trackingNumbers){
        if (number.isDefault) continue;
        try {
            const rules = JSON.parse(number.detectionRules);
            if (rules.urlParams) {
                for (const param of rules.urlParams){
                    if (urlParams.has(param)) {
                        return number;
                    }
                }
            }
            if (rules.utmSources && utmSource) {
                if (rules.utmSources.some((source)=>source.toLowerCase() === utmSource)) {
                    return number;
                }
            }
            if (rules.referrerIncludes && referrer) {
                if (rules.referrerIncludes.some((pattern)=>referrer.includes(pattern.toLowerCase()))) {
                    return number;
                }
            }
        } catch (error) {
            console.error(`[PhoneConfig] Error parsing detection rules:`, error);
        }
    }
    return null;
}
function getPhoneNumberFromTracking(trackingNumbers) {
    const detected = detectTrafficSource(trackingNumbers);
    if (detected) {
        setCookie(COOKIE_NAME, detected.channelKey, COOKIE_DAYS);
        return {
            display: detected.displayNumber,
            tel: detected.telLink
        };
    }
    const cookieSource = getCookie(COOKIE_NAME);
    if (cookieSource) {
        const matchingNumber = trackingNumbers.find((n)=>n.channelKey === cookieSource);
        if (matchingNumber) {
            return {
                display: matchingNumber.displayNumber,
                tel: matchingNumber.telLink
            };
        }
    }
    const defaultNumber = trackingNumbers.find((n)=>n.isDefault);
    if (defaultNumber) {
        return {
            display: defaultNumber.displayNumber,
            tel: defaultNumber.telLink
        };
    }
    return DEFAULT_PHONE;
}
function PhoneConfigProvider({ children }) {
    _s();
    const [phoneConfig, setPhoneConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_PHONE);
    const [marbleFallsConfig, setMarbleFallsConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(MARBLE_FALLS_PHONE);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PhoneConfigProvider.useEffect": ()=>{
            async function fetchTrackingNumbers() {
                try {
                    const response = await fetch('/api/tracking-numbers');
                    if (!response.ok) throw new Error('Failed to fetch tracking numbers');
                    const data = await response.json();
                    const trackingNumbers = data.trackingNumbers || [];
                    const austinNumbers = trackingNumbers.filter({
                        "PhoneConfigProvider.useEffect.fetchTrackingNumbers.austinNumbers": (n)=>!n.channelKey.toLowerCase().includes('marblefalls') && !n.channelKey.toLowerCase().includes('marble_falls')
                    }["PhoneConfigProvider.useEffect.fetchTrackingNumbers.austinNumbers"]);
                    const marbleFallsNumbers = trackingNumbers.filter({
                        "PhoneConfigProvider.useEffect.fetchTrackingNumbers.marbleFallsNumbers": (n)=>n.channelKey.toLowerCase().includes('marblefalls') || n.channelKey.toLowerCase().includes('marble_falls')
                    }["PhoneConfigProvider.useEffect.fetchTrackingNumbers.marbleFallsNumbers"]);
                    const austinConfig = getPhoneNumberFromTracking(austinNumbers);
                    const mfConfig = marbleFallsNumbers.length > 0 ? getPhoneNumberFromTracking(marbleFallsNumbers) : MARBLE_FALLS_PHONE;
                    setPhoneConfig(austinConfig);
                    setMarbleFallsConfig(mfConfig);
                    if ("TURBOPACK compile-time truthy", 1) {
                        window.__PHONE_CONFIG__ = austinConfig;
                        window.__MARBLE_FALLS_PHONE_CONFIG__ = mfConfig;
                    }
                } catch (error) {
                    console.error('[PhoneConfig] Error fetching tracking numbers:', error);
                }
            }
            fetchTrackingNumbers();
        }
    }["PhoneConfigProvider.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PhoneConfigContext.Provider, {
        value: phoneConfig,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MarbleFallsPhoneContext.Provider, {
            value: marbleFallsConfig,
            children: children
        }, void 0, false, {
            fileName: "[project]/src/contexts/PhoneConfigProvider.tsx",
            lineNumber: 183,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/contexts/PhoneConfigProvider.tsx",
        lineNumber: 182,
        columnNumber: 5
    }, this);
}
_s(PhoneConfigProvider, "PeOBlk9DfVcTjTIXiOw1RHDv02k=");
_c2 = PhoneConfigProvider;
function usePhoneConfig() {
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(PhoneConfigContext);
}
_s1(usePhoneConfig, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
function useMarbleFallsPhone() {
    _s2();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(MarbleFallsPhoneContext);
}
_s2(useMarbleFallsPhone, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "PhoneConfigContext");
__turbopack_context__.k.register(_c1, "MarbleFallsPhoneContext");
__turbopack_context__.k.register(_c2, "PhoneConfigProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_8db84c25._.js.map