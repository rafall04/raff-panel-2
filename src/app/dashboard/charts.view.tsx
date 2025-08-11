"use client";

import type { SSIDInfo } from "./actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define a specific interface for the tooltip props
interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
}

// Custom Tooltip for better styling, now with a correct and specific type
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-black/50 backdrop-blur-sm border border-white/20 rounded-md text-white">
                <p className="label">{`Host: ${label}`}</p>
                <p className="intro">{`Signal: ${payload[0].value} dBm`}</p>
            </div>
        );
    }
    return null;
};

export default function ChartsView({ ssidInfo }: { ssidInfo: SSIDInfo }) {
    const associatedDevices = ssidInfo.ssid
        .flatMap(s => s.associatedDevices)
        .map((device, index) => ({
            ...device,
            // Parse signal strength, defaulting to 0 if null or not parsable
            signalValue: device.signal ? parseInt(device.signal.replace(' dBm', ''), 10) : 0,
            // Provide a default name if hostName is not available
            name: device.hostName || `Device ${index + 1}`,
        }))
        // Filter out devices with no signal value for a cleaner chart
        .filter(device => device.signalValue !== 0);

    if (associatedDevices.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-gray-400">No associated devices with signal data to display.</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart
                    data={associatedDevices}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                        dataKey="name"
                        stroke="rgba(255, 255, 255, 0.7)"
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        stroke="rgba(255, 255, 255, 0.7)"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Signal (dBm)', angle: -90, position: 'insideLeft', fill: 'rgba(255, 255, 255, 0.7)', style: {textAnchor: 'middle'} }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize: "14px"}}/>
                    <Bar dataKey="signalValue" name="Signal Strength" fill="#8A2BE2" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
