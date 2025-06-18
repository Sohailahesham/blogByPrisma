import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const generateAccessToken = (payload: object) => { 
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: '1week',
    });
    return accessToken;
}

export default generateAccessToken;