"use client";

import { Signal, SignalHigh, SignalMedium, SignalLow } from 'lucide-react';

// RSSI (Received Signal Strength Indicator) values are in dBm and are negative.
// A value closer to 0 is a stronger signal.
// Good: > -67 dBm
// Fair: -68 to -70 dBm
// Weak: -71 to -80 dBm
// Very Weak: < -80 dBm
const SignalStrengthIcon = ({ signalDbm }: { signalDbm: number | null }) => {
    if (signalDbm === null) {
        return <span className="text-gray-500">N/A</span>;
    }

    if (signalDbm >= -67) {
        return <Signal size={20} className="text-green-400" />; // Excellent
    } else if (signalDbm >= -70) {
        return <SignalHigh size={20} className="text-yellow-400" />; // Good
    } else if (signalDbm >= -80) {
        return <SignalMedium size={20} className="text-orange-400" />; // Fair
    } else {
        return <SignalLow size={20} className="text-red-500" />; // Weak
    }
};

export default SignalStrengthIcon;
