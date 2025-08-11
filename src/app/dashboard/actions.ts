"use server";

import { getAuthSession } from "@/lib/auth";

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
}

const allowSsid = ["1", "5"];
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

const getSSIDInfo = async (): Promise<SSIDInfo | null> => {
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
            }).filter(v => !!v && allowSsid.includes(v.id)) as SSID[]
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

const setPassword = async (id: string, newPassword: string) => {
    const session = await getAuthSession();
    if (!allowSsid.includes(id)) {
        throw new Error(`Error setting password: SSID Not Allowed`);
    }
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
        const session = await getAuthSession();
        if (!session?.user?.id) {
            // This case should ideally not happen if the page is protected
            return null;
        }
        const res = await fetch(`${process.env.API_URL}/api/user/${session.user.id}`);
        if (!res.ok) {
            console.error(`Error fetching customer data: ${res.status} ${res.statusText}`);
            return null;
        }
        const data = await res.json();
        // Assuming the API returns data that matches the CustomerInfo interface.
        // If the data is nested, e.g., { user: {...} }, this needs to be data.user
        return data as CustomerInfo;
    } catch (error) {
        console.error("Failed to fetch customer info:", error);
        return null;
    }
}

export { rebootRouter, refreshObject, getSSIDInfo, setPassword, setSSIDName, getCustomerInfo };
export type {
    SSID,
    SSIDInfo,
    AssociatedDevice,
    CustomerInfo
}
