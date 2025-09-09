"use server";

"use server";

import { getAuthSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { updateCredentials } from "@/utils/auth.server";

// Helper to get auth headers
async function getAuthHeaders() {
    const session = await getAuthSession();
    const token = session?.user?.backendToken;
    if (!token) {
        throw new Error("User not authenticated or token not found");
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

interface AssociatedDevice {
    ip: string | null;
    mac: string | null;
    hostName: string | null;
    signal: string | null;
}

interface SSID {
    id: string;
    name: string;
    transmitPower: string;
    associatedDevices: AssociatedDevice[];
}

interface SSIDInfo {
    uptime: string | undefined;
    lastInform: string;
    ssid: SSID[];
}

interface CustomerInfo {
    name: string;
    packageName: string;
    monthlyBill: number;
    dueDate: string;
    paymentStatus: string;
    address: string;
    allowed_ssids?: string[];
}

interface ReportHistoryItem {
    id: string;
    category: string;
    status: 'Submitted' | 'In Progress' | 'Resolved';
    submittedAt: string;
}

interface DashboardStatus {
    activeBoost: {
        profile: string;
        expiresAt: string;
    } | null;
    activeReport: {
        id: string;
        category: string;
        status: 'Submitted' | 'In Progress';
    } | null;
}

interface BoostPackage {
    name: string;
    price: string;
    profile: string;
    speedBoostPrices: {
        "1_day": string;
        "3_days": string;
        "7_days": string;
    };
}

export interface Package {
    name: string;
    price: string;
    profile: string;
}

export async function getAvailablePackages(): Promise<Package[]> {
    try {
        const headers = await getAuthHeaders();
        // TODO: The endpoint is an assumption. Need to verify.
        const res = await fetch(`${process.env.API_URL}/api/packages`, { headers });
        if (!res.ok) {
            throw new Error('Failed to fetch packages');
        }
        const data = await res.json();
        return data.data;
    } catch (error) {
        console.error("Failed to fetch packages:", error);
        return [];
    }
}

export async function getBoostPackages(): Promise<BoostPackage[]> {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${process.env.API_URL}/api/speed-boost/packages`, { headers });
        if (!res.ok) {
            throw new Error('Failed to fetch boost packages');
        }
        const data = await res.json();
        return data.data;
    } catch (error) {
        console.error("Failed to fetch boost packages:", error);
        return [];
    }
}

const rebootRouter = async () => {
    try {
        const session = await getAuthSession();
        const req = await fetch(process.env.GENIEACS_URL + "/devices/" + session!.user.deviceId + "/tasks?connection_request", {
            method: 'POST',
            body: JSON.stringify({
                name: 'reboot',
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!req.ok) {
            throw new Error(`Error rebooting router: ${req.statusText}`);
        }

        return {
            message: "ok"
        };
    } catch (error) {
        console.error(error);
        throw new Error('Failed to reboot router');
    }
}

const refreshObject = async() => {
    const session = await getAuthSession();
    const req = await fetch(process.env.GENIEACS_URL + "/devices/" + session!.user.deviceId + "/tasks?connection_request", {
        method: 'POST',
        body: JSON.stringify({
            name: 'refreshObject',
            objectName: 'InternetGatewayDevice.LANDevice',
        })
    });
    if (!req.ok) {
        throw new Error(`Error refreshing object: ${req.statusText}`);
    }
    return {
        message: "ok"
    }
}

const getSSIDInfo = async (allowedSsids: string[]): Promise<SSIDInfo | null> => {
    try {
        const session = await getAuthSession();
        const res = await fetch(process.env.GENIEACS_URL + "/devices/?query=" + encodeURIComponent(JSON.stringify({ _id: session!.user.deviceId })));
        if (!res.ok) {
            throw new Error(`Error fetching data: ${res.statusText}`);
        }
        const data = await res.json();
        if (!data || !data[0]) {
            throw new Error('No data found for the given device ID');
        }
        return {
            lastInform: data[0]._lastInform || "Not Available",
            uptime: data[0].VirtualParameters.uptimeDevice?._value,
            ssid: Object.keys(data[0].InternetGatewayDevice.LANDevice['1'].WLANConfiguration).map(id => {
                const wlanConfig = data[0].InternetGatewayDevice.LANDevice['1'].WLANConfiguration[id];
                if (!wlanConfig.SSID) return null;
                return {
                    id,
                    name: wlanConfig.SSID._value,
                    transmitPower: wlanConfig.TransmitPower._value,
                    associatedDevices: Object.keys(wlanConfig.AssociatedDevice).slice(0, -3).map(v => {
                        const device = wlanConfig.AssociatedDevice[v];
                        return {
                            ip: device.AssociatedDeviceIPAddress?._value || null,
                            mac: device.AssociatedDeviceMACAddress?._value || null,
                            hostName: device.X_HW_AssociatedDevicedescriptions?._value || null,
                            signal: device.X_HW_RSSI?._value || null
                        };
                    })
                };
            }).filter(v => !!v && allowedSsids.includes(v.id)) as SSID[]
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

const setPassword = async (id: string, newPassword: string) => {
    const customerInfo = await getCustomerInfo();
    const allowSsid = customerInfo?.allowed_ssids && customerInfo.allowed_ssids.length > 0 ? customerInfo.allowed_ssids : ["1"];

    if (!allowSsid.includes(id)) {
        throw new Error(`Error setting password: SSID Not Allowed`);
    }
    const session = await getAuthSession();
    const req = await fetch(process.env.GENIEACS_URL + "/devices/" + session!.user.deviceId + "/tasks?connection_request", {
        method: 'POST',
        body: JSON.stringify({
            name: 'setParameterValues',
            parameterValues: [[`InternetGatewayDevice.LANDevice.1.WLANConfiguration.${id}.PreSharedKey.1.PreSharedKey`, newPassword, "xsd:string"]]
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!req.ok) {
        throw new Error(`Error setting password: ${req.statusText}`);
    }

    return {
        message: "ok"
    }
}

const setSSIDName = async (id: string, newName: string) => {
    const customerInfo = await getCustomerInfo();
    const allowSsid = customerInfo?.allowed_ssids && customerInfo.allowed_ssids.length > 0 ? customerInfo.allowed_ssids : ["1"];

    if (!allowSsid.includes(id)) {
        throw new Error(`Error setting name: SSID Not Allowed`);
    }
    const session = await getAuthSession();
    const req = await fetch(process.env.GENIEACS_URL + "/devices/" + session!.user.deviceId + "/tasks?connection_request", {
        method: 'POST',
        body: JSON.stringify({
            name: 'setParameterValues',
            parameterValues: [[`InternetGatewayDevice.LANDevice.1.WLANConfiguration.${id}.SSID`, newName, "xsd:string"]]
        }),
    });

    if (!req.ok) {
        throw new Error(`Error setting name: ${req.statusText}`);
    }

    return {
        message: "ok"
    }
}

const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${process.env.API_URL}/api/customer/profile`, { headers });
        if (!res.ok) {
            console.error(`Error fetching customer data: ${res.status} ${res.statusText}`);
            return null;
        }
        const data = await res.json();
        return data as CustomerInfo;
    } catch (error) {
        console.error("Failed to fetch customer info:", error);
        return null;
    }
}

export async function getWifiPageData(): Promise<SSIDInfo | null> {
    try {
        const customerInfo = await getCustomerInfo();

        const allowedSsids = customerInfo?.allowed_ssids && customerInfo.allowed_ssids.length > 0
            ? customerInfo.allowed_ssids
            : ["1"];

        const ssidInfo = await getSSIDInfo(allowedSsids);

        return ssidInfo;
    } catch (error) {
        console.error("Error fetching Wi-Fi page data:", error);
        return null;
    }
}

export async function getDashboardPageData() {
    try {
        const customerInfo = await getCustomerInfo();
        const allowedSsids = customerInfo?.allowed_ssids && customerInfo.allowed_ssids.length > 0
            ? customerInfo.allowed_ssids
            : ["1"];

        const [ssidInfo, dashboardStatus] = await Promise.all([
            getSSIDInfo(allowedSsids),
            getDashboardStatus()
        ]);

        return { ssidInfo, customerInfo, dashboardStatus };
    } catch (error) {
        console.error("Error fetching dashboard page data:", error);
        return { ssidInfo: null, customerInfo: null, dashboardStatus: { activeBoost: null, activeReport: null } };
    }
}

export async function getDashboardStatus(): Promise<DashboardStatus> {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${process.env.API_URL}/api/dashboard-status`, { headers });
        if (!res.ok) {
            console.error(`Error fetching dashboard status: ${res.status} ${res.statusText}`);
            throw new Error('Failed to fetch dashboard status');
        }
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch dashboard status:", error);
        return { activeBoost: null, activeReport: null };
    }
}

export async function submitReport(formData: FormData) {
    try {
        const status = await getDashboardStatus();
        if (status.activeReport) {
            return {
                success: false,
                message: "Anda sudah memiliki laporan aktif. Mohon tunggu hingga laporan tersebut diselesaikan sebelum mengirim yang baru."
            };
        }

        const session = await getAuthSession();
        if (!session?.user?.id) {
            return { message: 'Authentication data missing.', success: false };
        }

        const report = {
            category: formData.get('category'),
            reportText: formData.get('description')
        };

        const headers = await getAuthHeaders();
        const response = await fetch(`${process.env.API_URL}/api/lapor`, {
            method: 'POST',
            headers,
            body: JSON.stringify(report),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to submit report.' }));
            return { success: false, message: errorData.message || 'An unknown error occurred.' };
        }

        revalidatePath('/dashboard');
        return { message: 'Report submitted successfully!', success: true };
    } catch (error) {
        console.error(error);
        return { message: 'Failed to submit report.', success: false };
    }
}

export async function getReportHistory(): Promise<ReportHistoryItem[]> {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${process.env.API_URL}/api/reports/history`, { headers });
        if (!res.ok) {
            console.error(`Error fetching report history: ${res.status} ${res.statusText}`);
            throw new Error('Failed to fetch report history');
        }
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch report history:", error);
        return [];
    }
}

export async function requestSpeedBoost(targetPackageName: string, duration: string) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.id) {
          return { message: 'Authentication required.', success: false };
        }

        const boostRequest = {
            targetPackageName: targetPackageName,
            duration: duration
        };

        const headers = await getAuthHeaders();
        const response = await fetch(`${process.env.API_URL}/api/request-speed`, {
            method: 'POST',
            headers,
            body: JSON.stringify(boostRequest),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to request speed boost.' }));
            return { message: errorData.message || 'An unknown error occurred.', success: false };
        }

        revalidatePath('/dashboard/speed-boost');
        return { message: 'Speed boost requested successfully!', success: true };
    } catch (error) {
        console.error(error);
        return { message: 'An internal error occurred.', success: false };
    }
}

export async function requestPackageChange(targetPackageName: string) {
    try {
        const session = await getAuthSession();
        if (!session?.user?.id) {
          return { message: 'Authentication required.', success: false };
        }

        const changeRequest = {
            targetPackageName: targetPackageName,
        };

        const headers = await getAuthHeaders();
        const response = await fetch(`${process.env.API_URL}/api/customer/request-package-change`, {
            method: 'POST',
            headers,
            body: JSON.stringify(changeRequest),
        });

        const responseData = await response.json();

        if (!response.ok) {
            return { message: responseData.message || 'An unknown error occurred.', success: false };
        }

        revalidatePath('/dashboard/settings');
        return { message: responseData.message || 'Package change requested successfully!', success: true };
    } catch (error) {
        console.error(error);
        return { message: 'An internal error occurred.', success: false };
    }
}

export async function getCompanyName(): Promise<string> {
    try {
        // This function can be called from server components/pages.
        const res = await fetch(`${process.env.API_URL}/api/wifi-name`, {
            cache: 'force-cache' // Cache the result as it's not expected to change often
        });
        if (!res.ok) {
            console.error(`Error fetching company name: ${res.status} ${res.statusText}`);
            return "Default WiFi Portal"; // Fallback name
        }
        const data = await res.json();
        return data.wifiName;
    } catch (error) {
        console.error("Failed to fetch company name:", error);
        return "Default WiFi Portal"; // Fallback name
    }
}

export { rebootRouter, refreshObject, getSSIDInfo, setPassword, setSSIDName, getCustomerInfo, updateCredentials, getWifiPageData, getDashboardPageData };
export type {
    SSID,
    SSIDInfo,
    AssociatedDevice,
    CustomerInfo,
    BoostPackage,
    ReportHistoryItem,
    DashboardStatus
}
