import { IsString, IsArray, IsOptional, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(8000)
  content!: string;
}

export class ChatDto {
  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsArray()
  @IsOptional()
  history?: ChatMessageDto[];

  @IsString()
  @IsOptional()
  contexto?: string;
}