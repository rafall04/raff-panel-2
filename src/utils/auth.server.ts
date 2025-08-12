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
    return req.status;
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