// mail.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MailService } from './mail.service';

// DTO com validações
class SendMailDto {
  @IsEmail()
  to!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200) // evita subjects enormes
  subject!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}

// Sanitização simples contra header injection (CRLF)
function assertNoHeaderInjection(...inputs: string[]) {
  for (const value of inputs) {
    if (/[\r\n]/.test(value)) {
      throw new BadRequestException('Valores não podem conter quebras de linha.');
    }
  }
}

@Controller('mail')
@UsePipes(
  new ValidationPipe({
    whitelist: true,            // remove campos extras
    forbidNonWhitelisted: true, // bloqueia extras
    transform: true,            // transforma tipos básicos
  }),
)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async sendMail(@Body() dto: SendMailDto) {
    // Segurança extra: impedir CRLF em cabeçalhos
    assertNoHeaderInjection(dto.to, dto.subject);

    const result = await this.mailService.sendMailLocawebBase(
      dto.to,
      dto.subject,
      dto.body,
    );

    return {
      ok: true,
      message: 'E-mail enviado com sucesso',
      id: result?.info?.messageId ?? null,
      response: result?.info?.response ?? null,
    };
  }
}
