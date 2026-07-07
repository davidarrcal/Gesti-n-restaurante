import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RolUsuario } from '@prisma/client';
import { ToolExecutorService } from './ia.tool-executor';
import { TOOLS } from './ia.tools';

const MODEL = 'moonshotai/kimi-k2.6';
const MAX_TURNS = 6;

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AsistenteService {
  private readonly logger = new Logger(AsistenteService.name);

  constructor(
    private config: ConfigService,
    private toolExecutor: ToolExecutorService,
  ) {}

  async chat(
    message: string,
    history: ChatTurn[],
    contexto: string,
    user: { id: string; nombre: string; rol: RolUsuario; restauranteId: string },
  ): Promise<{ reply: string }> {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      return {
        reply:
          'El asistente de IA no está configurado. Falta la variable de entorno OPENROUTER_API_KEY.',
      };
    }

    const systemPrompt = this.buildSystemPrompt(user, contexto);

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    const recentHistory = history.slice(-10);
    for (const h of recentHistory) {
      messages.push({ role: h.role, content: h.content });
    }

    messages.push({ role: 'user', content: message });

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await this.callOpenRouter(apiKey, messages);
      const assistantMsg = response.choices?.[0]?.message;

      if (!assistantMsg) {
        return { reply: 'No he recibido respuesta del modelo.' };
      }

      messages.push({
        role: 'assistant',
        content: assistantMsg.content ?? '',
        ...(assistantMsg.tool_calls ? { tool_calls: assistantMsg.tool_calls } : {}),
      });

      const toolCalls = assistantMsg.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        return { reply: assistantMsg.content ?? '(sin texto)' };
      }

      for (const tc of toolCalls) {
        const fnName = tc.function.name;
        let fnArgs: Record<string, any> = {};
        try {
          fnArgs = JSON.parse(tc.function.arguments || '{}');
        } catch {
          fnArgs = {};
        }

        this.logger.log(
          `Tool call: ${fnName} args=${JSON.stringify(fnArgs)} user=${user.id}`,
        );

        let result: any;
        try {
          result = await this.toolExecutor.execute(fnName, fnArgs, user);
        } catch (err: any) {
          result = { error: err.message ?? 'Error ejecutando herramienta' };
        }

        const resultStr = this.truncate(JSON.stringify(result), 8000);

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: fnName,
          content: resultStr,
        });
      }
    }

    const lastAssistant = messages.filter((m) => m.role === 'assistant').pop();
    return { reply: lastAssistant?.content ?? 'Se alcanzó el límite de turnos.' };
  }

  private buildSystemPrompt(
    user: { nombre: string; rol: RolUsuario },
    contexto: string,
  ): string {
    const rolLabel = {
      [RolUsuario.ADMIN]: 'Administrador',
      [RolUsuario.GERENTE]: 'Gerente',
      [RolUsuario.COCINERO]: 'Cocinero',
    }[user.rol];

    return [
      'Eres el asistente virtual integrado en un sistema de gestión de inventario y escandallos para restaurantes.',
      'Ayudas al usuario a consultar información, gestionar productos, registrar entradas/salidas, crear platos con escandallos y generar informes.',
      '',
      `Usuario actual: ${user.nombre} (rol: ${rolLabel}).`,
      'Debes respetar los permisos del rol del usuario. No intentes acciones que no estén permitidas para su rol.',
      contexto ? `Contexto actual de la pantalla: ${contexto}` : '',
      '',
      'Normas:',
      '- Responde en español, de forma concisa y profesional.',
      '- Usa las herramientas (functions) disponibles para consultar datos reales del sistema antes de responder.',
      '- Cuando el usuario pida crear, modificar o eliminar algo, usa la herramienta correspondiente y confirma el resultado.',
      '- Si una herramienta devuelve error, informa al usuario y sugiere alternativas.',
      '- No inventes datos: si no tienes información, usa las herramientas para obtenerla.',
      '- Las cantidades de ingredientes en escandallos están en subunidad (g, mL, uds).',
      '- El stock de productos está en la unidad del producto (KG, G, L, mL, UDS) y el precio es por unidad de medida.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async callOpenRouter(
    apiKey: string,
    messages: OpenRouterMessage[],
  ): Promise<any> {
    const siteUrl = this.config.get<string>('OPENROUTER_SITE_URL') ?? '';
    const appName = this.config.get<string>('OPENROUTER_APP_NAME') ?? 'Gestión Restaurante';

    const body: Record<string, any> = {
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 2000,
      tools: TOOLS,
      tool_choice: 'auto',
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    if (siteUrl) headers['HTTP-Referer'] = siteUrl;
    headers['X-Title'] = appName;

    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      this.logger.error(`OpenRouter error ${res.status}: ${errText}`);
      throw new Error(`Error del servicio de IA (${res.status})`);
    }

    return res.json();
  }

  private truncate(str: string, max: number): string {
    if (str.length <= max) return str;
    return str.slice(0, max) + '...[truncado]';
  }
}