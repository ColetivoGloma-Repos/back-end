import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  async sendMailLocawebBase(to: string, subject: string, body: string) {
    const transporter = nodemailer.createTransport({
      host: 'smtplw.com.br',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: 'coletivogloma@info.coletivogloma.com.br', 
      to,
      subject,
      text: body,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return { message: 'E-mail enviado com sucesso', info };
    } catch (error) {
      throw new Error('Erro ao enviar e-mail pela Locaweb: ' + error.message);
    }
  }
}