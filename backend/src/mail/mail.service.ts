import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name); // Logger dedicado para rastrear operações de email.
  private transporter: nodemailer.Transporter; // Transportador do Nodemailer para enviar emails.
  
  constructor(private readonly configService: ConfigService) {
    // Configura o transportador SMTP usando variáveis de ambiente para segurança e flexibilidade.
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Exemplo usando Gmail; pode ser configurado para outros serviços ou SMTP personalizado.
      auth: {
        user: this.configService.get<string>('EMAIL_USER'), // Email do remetente, definido em .env.
        pass: this.configService.get<string>('EMAIL_PASS'), // Senha ou token de app, definido em .env.
      },
    });
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_USER'),
      to,
      
      subject: 'Verificação da conta',

      html: `
        <h2>Bem-vindo à Deepthought</h2>

        <p>O seu código OTP é:</p>

        <h1>${code}</h1>

        <p>Este código expira em 10 minutos.</p>
      `,
    });

    this.logger.log(`OTP enviado para ${to}`);
  }
}
