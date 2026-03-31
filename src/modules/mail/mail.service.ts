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
      from: 'coletivogloma@infos.coletivogloma.com.br', 
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

  async sendWelcomeMail(to: string, name: string) {
    const subject = 'Bem-vindo ao Coletivo Gloma!';
    const body = `Olá, ${name}!\n\nSeja bem-vindo(a) ao Coletivo Gloma. Estamos felizes em ter você conosco!\n\nQualquer dúvida, estamos à disposição.\n\nEquipe Coletivo Gloma`;
    return this.sendMailLocawebBase(to, subject, body);
  }
}