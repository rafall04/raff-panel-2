"use server"

export const requestOtp = async (phoneNumber: string) => {
    const req = await fetch(`${process.env.API_URL}/api/otp`, {
        method: 'POST',
        body: JSON.stringify({
            phoneNumber
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return req;
}

export const verify = async (phoneNumber: string, otp: string) => {
    const req =  await fetch(`${process.env.API_URL}/api/otpverify`, {
        method: 'POST',
        body: JSON.stringify({
            phoneNumber,
            otp
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const json = await req.json();

    return {
        status: req.status,
        user: json.user as { deviceId: string },
        token: json.token as string | undefined
    }
}

export const verifyPassword = async (username: string, password: string) => {
    const req =  await fetch(`${process.env.API_URL}/api/customer/login`, {
        method: 'POST',
        body: JSON.stringify({
            username,
            password
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    if (req.status !== 200) {
        return {
            status: req.status,
            user: null,
            token: undefined
        }
    }

    const json = await req.json();

    return {
        status: req.status,
        user: json.user as { deviceId: string },
        token: json.token as string | undefined
    }
}

export const updateCredentials = async (currentPassword: string, newUsername?: string, newPassword?: string) => {
    // We need to get the session to get the backend token
    const { getAuthSession } = await import('@/lib/auth');
    const session = await getAuthSession();

    if (!session?.user?.backendToken) {
        return {
            status: 401,
            message: "Not authenticated"
        }
    }

    const body: { currentPassword: string; newUsername?: string; newPassword?: string } = { currentPassword };
    if (newUsername) {
        body.newUsername = newUsername;
    }
    if (newPassword) {
        body.newPassword = newPassword;
    }

    const req = await fetch(`${process.env.API_URL}/api/customer/account/update`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.backendToken}`
        }
    });

    const json = await req.json();

    return {
        status: req.status,
        message: json.message
    }
}