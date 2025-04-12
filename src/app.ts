import express from 'express';
import config from './config';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import cron from 'node-cron';

const app = express();

app.use(express.json());
const dataFilePath = path.join(__dirname, 'data', 'updateDate.json');
const certDir = path.join(__dirname, 'ssl');

function runCertbot(command: string, callback: (error: Error | null, stdout?: string) => void) {
    exec(command, { cwd: certDir }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ошибка: ${error.message}`);
            return callback(error);
        }
        if (stderr) {
            console.error(`Ошибка: ${stderr}`);
            return callback(new Error(stderr));
        }
        console.log(`Результат: ${stdout}`);
        callback(null, stdout);
    });
}

function checkAndUpdateCertificate() {
    const currentDate = new Date();
    const dataDir = path.dirname(dataFilePath);

    // Создаем директорию для данных, если она не существует
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dataFilePath)) {
        // Если файл не существует, создаем сертификат
        const command = `certbot certonly --non-interactive --email ${config.email} --agree-tos -d ${config.domain}`;
        runCertbot(command, (error) => {
            if (error) {
                console.error('Ошибка при создании сертификата.');
            } else {
                const initialData = {
                    lastUpdated: currentDate.toISOString(),
                };
                fs.writeFile(dataFilePath, JSON.stringify(initialData, null, 2), (err) => {
                    if (err) {
                        console.error('Ошибка при записи в файл:', err);
                    } else {
                        console.log('Файл updateDate.json создан. Дата обновления:', currentDate);
                    }
                });
            }
        });
    } else {
        fs.readFile(dataFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Ошибка при чтении файла:', err);
                return;
            }

            const jsonData = JSON.parse(data);
            const lastUpdated = new Date(jsonData.lastUpdated);
            const timeDiff = currentDate.getTime() - lastUpdated.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            console.log(`Дата последнего обновления: ${lastUpdated.toISOString()}`);
            console.log(`Прошло дней с последнего обновления: ${daysDiff}`);

            if (daysDiff > 85) {
                const command = `certbot certonly --non-interactive --email ${config.email} --agree-tos -d ${config.domain}`;
                runCertbot(command, (error) => {
                    if (error) {
                        console.error('Ошибка обновления сертификата.');
                    } else {
                        const updatedData = {
                            lastUpdated: currentDate.toISOString(),
                        };
                        fs.writeFile(dataFilePath, JSON.stringify(updatedData, null, 2), (err) => {
                            if (err) {
                                console.error('Ошибка при записи в файл:', err);
                            } else {
                                console.log('Сертификат успешно обновлен. Дата обновления:', currentDate);
                            }
                        });
                    }
                });
            } else {
                console.log('Сертификат еще не требует обновления.');
            }
        });
    }
}

checkAndUpdateCertificate();

cron.schedule('0 0 * * *', () => {
    console.log('Запуск ежедневной проверки сертификатов...');
    checkAndUpdateCertificate();
});


app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});

