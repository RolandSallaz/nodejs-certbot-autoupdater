import express from 'express';
import config from './config';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import cron from 'node-cron';

const app = express();

app.use(express.json());
app.use('/.well-known', express.static('/var/www/certbot')); // webroot для certbot

const dataFilePath = path.join(__dirname, 'data', 'updateDate.json');
const certDir = '/app/ssl';

function runCertbot(command: string, callback: (error: Error | null, stdout?: string) => void) {
    exec(command, { cwd: certDir, shell: '/bin/sh' }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка: ${error.message}`);
            return callback(error);
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
        callback(null, stdout);
    });
}

function checkAndUpdateCertificate() {
    const currentDate = new Date();
    const dataDir = path.dirname(dataFilePath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    if (!fs.existsSync(dataFilePath)) {
        const command = `certbot certonly --webroot -w /var/www/certbot \
--non-interactive --agree-tos --email ${config.email} -d ${config.domain} \
--config-dir /app/ssl --work-dir /app/ssl --logs-dir /app/ssl/logs`;

        runCertbot(command, (error) => {
            if (!error) {
                fs.writeFileSync(dataFilePath, JSON.stringify({ lastUpdated: currentDate.toISOString() }, null, 2));
                console.log('Сертификат создан и записан.');
            }
        });
    } else {
        try {
            const jsonData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
            const lastUpdated = new Date(jsonData.lastUpdated);
            const daysDiff = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff > 85) {
                const command = `certbot certonly --webroot -w /var/www/certbot \
--non-interactive --agree-tos --email ${config.email} -d ${config.domain} \
--config-dir /app/ssl --work-dir /app/ssl --logs-dir /app/ssl/logs`;

                runCertbot(command, (error) => {
                    if (!error) {
                        fs.writeFileSync(dataFilePath, JSON.stringify({ lastUpdated: currentDate.toISOString() }, null, 2));
                        console.log('Сертификат обновлён.');
                    }
                });
            } else {
                console.log('Сертификат ещё действителен.');
            }
        } catch (e) {
            console.error('Ошибка парсинга JSON:', e);
        }
    }
}

checkAndUpdateCertificate();

cron.schedule('0 0 * * *', () => {
    console.log('Запущена ежедневная проверка сертификата...');
    checkAndUpdateCertificate();
});

app.listen(config.port, () => {
    console.log(`Сервер запущен на порту ${config.port}`);
});