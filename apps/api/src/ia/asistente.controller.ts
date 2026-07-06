import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AsistenteService } from './asistente.service';
import { ChatDto } from './dto/chat.dto';

@Controller('ia')
@UseGuards(AuthGuard('jwt'))
export class AsistenteController {
  constructor(private readonly service: AsistenteService) {}

  @Post('chat')
  async chat(@Body() dto: ChatDto, @Request() req: any) {
    const user = req.user;
    return this.service.chat(
      dto.message,
      dto.history ?? [],
      dto.contexto ?? '',
      { id: user.id, nombre: user.email, rol: user.rol },
    );
  }
}