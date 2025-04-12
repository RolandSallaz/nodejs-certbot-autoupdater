import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    email: string;
    domain: string;
}

const config: Config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    email: process.env.EMAIL || "your-email@example.com",
    domain: process.env.DOMAIN || "yourdomain.com"
};

export default config;