import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MailService {
  async sendMailLocaweb(to: string, subject: string, body: string) {
    const apiUrl = process.env.API_REQUEST_LOCAWEB;
    const apiKey = process.env.LOCALWEB_KEY;

    const payload = {
      subject,
      body,
      from: process.env.SMTP_MAIL_HOST,
      to,
      headers: {
        'Content-Type': 'text/plain',
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    try {
      const response = await axios.post(apiUrl, payload, { headers });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao enviar e-mail pela Locaweb: ' + error.message);
    }
  }
}